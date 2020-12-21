({
  closeModal: function (component, event) {
    component.set("v.isOpen", false);
    event.preventDefault();
  },
  openModal: function (component, message) {
    component.set("v.documentId", message.getParam("message"));
    component.set("v.isOpen", true);
  },
  cancelBubble: function (component, event) {
    event.preventDefault();
    event.cancelBubble();
    event.stopPropagation();
  }
});
