import { LightningElement, api, wire } from "lwc";
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from "lightning/flowSupport";
import getEmailTemplates from "@salesforce/apex/FlowEmailComposerCtrl.getEmailTemplates";
import getTemplateDetails from "@salesforce/apex/FlowEmailComposerCtrl.getTemplateDetails";
import sendAnEmailMsg from "@salesforce/apex/FlowEmailComposerCtrl.sendAnEmailMsg";
import TickerSymbol from "@salesforce/schema/Account.TickerSymbol";

export default class FlowEmailComposer extends LightningElement {
  @api availableActions = [];

  @api whoId = null;
  @api whatId = null;
  uploadRefId = null;
  @api emailBody = "";
  selTemplateId = null;
  selectedDocumentId = null;
  hasModalOpen = false;
  showSpinner = false;
  selFolderId = null;
  filteredTemplateList = [{ label: "--Select a Template--", value: "select" }];
  @api subject = "";
  folders = [{ label: "--Select an E-mail Template Folder--", value: "select" }];
  emailTemplates = [];
  recordError = "";
  @api filesTobeAttached = [];
  attachmentsFromTemplate = [];

  @api senderName = "";
  @api fromAddress = "";
  @api toAddresses = "";
  @api ccAddresses = "";
  @api bccAddresses = "";
  @api showCCField = false;
  @api showBccField = false;
  @api emailTemplateId = null;
  @api hideTemplateSelection = false;
  @api logEmail = false;
  @api showSendButton = false;
  @api sendOnNext = false;

  get showCCButton() {
    return this.showCCField && !this.ccAddresses;
  }

  get hasTemplateAttachments() {
    return this.attachmentsFromTemplate && this.attachmentsFromTemplate.length > 0;
  }

  get showBCCButton() {
    return this.showBccField && !this.bccAddresses;
  }

  get sendButtonDisabled() {
    return !this.toAddresses && !this.subject && !this.emailBody;
  }

  get showCCFieldFinal() {
    return this.showCCField || this.ccAddresses;
  }

  get showBCCFieldFinal() {
    return this.showBCCField || this.bccAddresses;
  }

  _updateFlowAttr(attrName, value) {
    const attrEvent = new FlowAttributeChangeEvent(attrName, value);
    this.dispatchEvent(attrEvent);
  }

  handleSubjectChange(event) {
    this.subject = event.target.value;
    this._updateFlowAttr("subject", this.subject);
  }

  handleBodyChange(event) {
    this.emailBody = event.target.value;
    this._updateFlowAttr("emailBody", this.emailBody);
  }

  handleToAddressesChange(event) {
    this.toAddresses = event.target.value;
    this._updateFlowAttr("toAddresses", this.toAddresses);
  }

  handleCCAddressesChange(event) {
    this.ccAddresses = event.target.value;
    this._updateFlowAttr("ccAddresses", this.ccAddresses);
  }

  handleBCCAddressesChange(event) {
    this.bccAddresses = event.target.value;
    this._updateFlowAttr("bccAddresses", this.bccAddresses);
  }

  updateTemplateId(event) {
    this.emailTemplateId = event.target.value;
    this._updateFlowAttr("emailTemplateId", this.emailTemplateId);
  }

  @wire(getEmailTemplates)
  wiredGetEmailTemplates({ error, data }) {
    if (error) {
      console.error(error);
    } else if (data) {
      this.emailTemplates = data;
      this.folders = data.map((d) => ({
        label: d.Folder ? d.Folder.Name : "No Name",
        value: d.FolderId
      }));
    }
  }

  filterEmailTemplates(event) {
    this.selFolderId = event.target.value;
    const defaultVal = { label: "--Select a Template--", value: null };
    const filteredVals = this.emailTemplates
      .filter((e) => e.FolderId === this.selFolderId)
      .map((t) => ({ label: t.Name, value: t.Id }));
    this.filteredTemplateList = [defaultVal, ...filteredVals];
  }

  changeBody(event) {
    this.updateTemplateId(event);
    this.showSpinner = true;
    this.selTemplateId = event.target.value;
    getTemplateDetails({
      templateId: this.selTemplateId,
      whoId: this.whoId,
      whatId: this.whatId
    })
      .then((result) => {
        this.emailBody = result.body;
        this.subject = result.subject;
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        this.showSpinner = false;
      });
  }

  _getSendParams() {
    return {
      fromAddress: this.fromAddress,
      toAddressesStr: this.toAddresses,
      ccAddressesStr: this.ccAddresses,
      bccAddressesStr: this.bccAddresses,
      subject: this.subject,
      whoId: this.whoId,
      whatId: this.whatId,
      body: this.emailBody,
      senderDisplayName: this.senderName,
      contentDocumentIds: [],
      attachmentIds: [],
      createActivity: this.logEmail
    };
  }

  async sendEmail() {
    this.showSpinner = true;
    const params = this._getSendParams();
    try {
      await sendAnEmailMsg(params);
      console.log("message sent");
    } catch (err) {
      console.error("an error occurred", err);
      throw err;
    } finally {
      this.showSpinner = false;
    }
  }

  async handleGoNext() {
    // check if NEXT is allowed on this screen
    if (this.availableActions.find((action) => action === "NEXT")) {
      // navigate to the next screen
      if (this.sendOnNext === true) {
        await this.sendEmail();
      }
      const navigateNextEvent = new FlowNavigationNextEvent();
      this.dispatchEvent(navigateNextEvent);
    }
  }
}
