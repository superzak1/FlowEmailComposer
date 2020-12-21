import { LightningElement, api, wire } from "lwc";
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from "lightning/flowSupport";
import getEmailTemplates from "@salesforce/apex/FlowEmailComposerCtrl.getEmailTemplates";
import getTemplateDetails from "@salesforce/apex/FlowEmailComposerCtrl.getTemplateDetails";
import deleteFile from "@salesforce/apex/FlowEmailComposerCtrl.deleteFiles";
import sendAnEmailMsg from "@salesforce/apex/FlowEmailComposerCtrl.sendAnEmailMsg";
import searchContacts from "@salesforce/apex/ContactSearchController.searchContacts";
import getMostRecentlyViewedContacts from "@salesforce/apex/ContactSearchController.getMostRecentlyViewed";
import EMAILMC from "@salesforce/messageChannel/EmailComposer__c";
import { publish, MessageContext } from "lightning/messageService";

export default class FlowEmailComposer extends LightningElement {
  @api availableActions = [];

  @api whoId = null;
  @api whatId = null;
  uploadRefId = null;
  @api emailBody = "";
  selTemplateId = null;
  @api selectedDocumentId = null;
  @api hasModalOpen = false;
  showSpinner = false;
  @api selFolderId;
  filteredTemplateList = [{ label: "--Select a Template--", value: "select" }];
  @api subject = "";
  folders = [{ label: "--Select an E-mail Template Folder--", value: "select" }];
  emailTemplates = [];
  recordError = "";
  @api filesTobeAttached = [];
  attachmentsFromTemplate = [];
  defaultSearchResults = [];

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

  @wire(MessageContext)
  messageContext;

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

  @wire(getMostRecentlyViewedContacts)
  wiredMostRecentlyViewed({ error, data }) {
    if (!error && data) {
      this.defaultSearchResults = data;
      this.initDefaultContactSearchResults();
    }
  }

  initDefaultContactSearchResults() {
    const lookup = this.template.querySelector("c-lookup");
    if (lookup) lookup.setDefaultResults(this.defaultSearchResults);
  }

  connectedCallback() {
    this.initDefaultContactSearchResults();
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

  handleTemplateFolderChange(event) {
    this.selFolderId = event.target.value;
    this.filterEmailTemplates();
  }

  handleRemoveAttachment(event) {
    const attachId = event.target.name;
    this.attachmentsFromTemplate = this.attachmentsFromTemplate.filter((f) => f.attachId !== attachId);
  }

  handleDeleteFile(event) {
    const fileId = event.target.name;
    this.filesTobeAttached = this.filesTobeAttached.filter((file) => file.documentId !== fileId);
    this.deleteFile(fileId);
  }

  handleWhoIdChange(event) {
    this.whoId = event.detail[0];
  }

  async handleContactSearch(event) {
    const lookup = event.target;
    try {
      let searchResults = await searchContacts(event.detail);
      lookup.setSearchResults(searchResults);
    } catch (err) {
      console.error("Contact search error", err);
    }
  }

  uploadFinished(event) {
    const files = event.detail.files;
    if (this.filesTobeAttached && this.filesTobeAttached.length > 0)
      this.filesTobeAttached = this.filesTobeAttached.concat(files);
    else this.filesTobeAttached = files;
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
      this.filterEmailTemplates();
    }
  }

  filterEmailTemplates() {
    const defaultVal = { label: "--Select a Template--", value: null };
    this.filteredTemplateList = [defaultVal];
    if (this.selFolderId) {
      const filteredVals = this.emailTemplates
        .filter((e) => e.FolderId === this.selFolderId)
        .map((t) => ({ label: t.Name, value: t.Id }));
      this.filteredTemplateList.push(...filteredVals);
    }
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
        this.attachmentsFromTemplate = result.fileAttachments;
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        this.showSpinner = false;
      });
  }

  previewFile(event) {
    this.selectedDocumentId = event.target.name;
    this.hasModalOpen = true;
    publish(this.messageContext, EMAILMC, { message: this.selectedDocumentId });
    /** 
    this._updateFlowAttr("selectedDocumentId", this.selectedDocumentId);
    this._updateFlowAttr("hasModalOpen", this.hasModalOpen);
*/
  }

  closeModal() {
    this.hasModalOpen = false;
    this.selectedDocumentId = null;
    this._updateFlowAttr("hasModalOpen", this.hasModalOpen);
  }

  _getContentDocIds() {
    return this.filesTobeAttached.map((f) => f.documentId).concat(this.attachmentsFromTemplate.map((f) => f.attachId));
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
      contentDocumentIds: this._getContentDocIds(),
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

  async deleteFile(docId) {
    try {
      let result = await deleteFile({ sdocumentId: docId });
      console.log("file deleted");
    } catch (err) {
      console.error("could not delete file", err);
    }
  }
}
