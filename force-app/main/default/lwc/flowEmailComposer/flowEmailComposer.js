import { LightningElement,api } from 'lwc';

export default class FlowEmailComposer extends LightningElement {

    @api whoId='';
    @api whatId='';
    uploadRefId='';
    @api emailBody='';
    selTemplateId='';
    selectedDocumentId='';
    hasModalOpen=false;
    showSpinner=false;
    selFolderId='';
    filteredTemplateList=[];
    @api subject='';
    folders=[];
    emailTemplates=[];
    recordError='';
    @api filesTobeAttached=[];
    attachmentsFromTemplate=[];

    @api senderName='';
    @api fromAddress='';
    @api toAddresses='';
    @api ccAddresses='';
    @api bccAddresses='';
    @api showCCField=false ;
    @api showBccField=false;
    @api emailTemplateId='';
    @api hideTemplateSelection=false;
    @api logEmail=false;

    get showCCButton(){
        return this.showCCField && !this.ccAddresses;
    }

    get showBCCButton(){
        return this.showBccField && !this.bccAddresses;
    }

    get showCCFieldFinal(){
        return this.showCCField || this.ccAddresses;
    }

    get showBCCFieldFinal(){
        return this.showBCCField || this.bccAddresses;
    }


}