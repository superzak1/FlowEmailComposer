import { LightningElement, api, wire } from "lwc";
import getEmailTemplates from "@salesforce/apex/FlowEmailComposerCtrl.getEmailTemplates";
import getTemplateDetails from "@salesforce/apex/FlowEmailComposerCtrl.getTemplateDetails";

export default class FlowEmailComposer extends LightningElement {
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
  folders = [
    { label: "--Select an E-mail Template Folder--", value: "select" }
  ];
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

  get showCCButton() {
    return this.showCCField && !this.ccAddresses;
  }

  get hasTemplateAttachments() {
    return (
      this.attachmentsFromTemplate && this.attachmentsFromTemplate.length > 0
    );
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
      });
  }
}
