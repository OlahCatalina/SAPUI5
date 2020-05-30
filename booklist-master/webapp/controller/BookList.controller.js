sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
 ], function (Controller, Fragment, MessageToast, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("org.ubb.books.controller.BookList", {
        onInit: function(){
            this.book = {
                ISBN: "",
                Author: "",
                Title: "",
                PublicationDate: "",
                Language: "",
                AvailableNumber: "",
                TotalNumber: ""
            },
            this.addOperation = false,
            this.updateOperation = false
        },
        // called when "Sort" button is pressed
        onSortButtonPressed: function(oEvent) { 
            this._oDialog = sap.ui.xmlfragment("org.ubb.books.fragments.Sorter", this);
            this._oDialog.setModel(this.getView().getModel("i18n"), "i18n");
            this._oDialog.open();
        },
        // called when "Delete" button is pressed
        onDeleteBookButtonPressed(oEvent) {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const aSelContexts = this.byId("idBooksTable").getSelectedContexts();
            if(aSelContexts.length != 0) {
                const sPathToBook = aSelContexts[0].getPath();
                this.getView().getModel().remove(sPathToBook, {
                    success: function(){
                        MessageToast.show(oResourceBundle.getText("success"));
                    }, 
                    error:function() {
                        MessageToast.show(oResourceBundle.getText("error"));
                    }});
            }
            else {
                MessageToast.show(oResourceBundle.getText("selectToDelete"));
            }
        },
        // called when "Update" button is pressed
        onUpdateBookButtonPressed(oEvent){
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const aSelContexts = this.byId("idBooksTable").getSelectedContexts();
            if(aSelContexts.length != 0) {
                if(!this.bookDialog) {
                    this.bookDialog = sap.ui.xmlfragment("org.ubb.books.fragments.UpdateBook", this);   
                }

                // disable isbn field
                sap.ui.getCore().byId("isbnInput").setEnabled(false);

                const bookObj = aSelContexts[0].getObject();

                // format date to show short format
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "dd/MM/yyyy" }); 
                var date = new Date(bookObj.PublicationDate);
                var dateStr = dateFormat.format(date);
                bookObj.PublicationDate = dateStr;
                this.book = bookObj;

                // mark the update operation 
                this.updateOperation = true;
                this.addOperation = false;

                var oModel = new sap.ui.model.json.JSONModel();
                this.bookDialog.setModel(oModel);
                this.bookDialog.getModel().setData(bookObj);

                this.bookDialog.open();
            }
            else {
                MessageToast.show(oResourceBundle.getText("selectToUpdate"));
            }
        },
        // called when "Add" button is pressed
        onAddBookButtonPressed(oEvent) {
            var oView = this.getView();
            if(!this.bookDialog) {
                this.bookDialog = sap.ui.xmlfragment("org.ubb.books.fragments.UpdateBook", this);   
                oView.addDependent(this.bookDialog);
            }

            // enable isbn field
            sap.ui.getCore().byId("isbnInput").setEnabled(true);


            // mark the add operation 
            this.updateOperation = false;
            this.addOperation = true;

            var oModel = new sap.ui.model.json.JSONModel();
            this.bookDialog.setModel(oModel);
            this.book.ISBN = "";
            this.book.Author = "";
            this.book.Title = "";
            this.book.PublicationDate = "";
            this.book.Language = "";
            this.book.AvailableNumber = "";
            this.book.TotalNumber = "";
            this.bookDialog.getModel().setData(this.book);

            var oTable = this.getView().byId("idBooksTable");
            oTable.removeSelections();

            this.bookDialog.open();
        },
        // called when confirm button from Sorting modal is pressed
        onConfirm: function(oEvent) {
            var oView = this.getView();
            var oTable = oView.byId("idBooksTable");
            var mParams = oEvent.getParameters();
            var oBinding = oTable.getBinding("items");

            // apply sorter
            var aSorters = [];
            var sPath = mParams.sortItem.getKey();
            var bDescending = mParams.sortDescending;
            aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
            oBinding.sort(aSorters);

        },
        // validates the inputs from the filter inputs
        areFiltersValid: function(isbn, dateStart, dateEnd, language){
            var isValid = true;
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            if(isbn != "" && isbn.length != 13){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("isbnWarning"));
            }            
            else if(language != "" && language.length != 2){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("languageCodeWarning"));
            }
            else if(dateStart != "" && dateEnd != "" && dateStart > dateEnd){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("datesOrderWarning"));
            }
            return isValid;
        },
        // called when filtering
        onSearchButtonPressed(oEvent){
            // get the data from the inputs
            var isbn = this.byId("inputISBN").getValue();
            var title = this.byId("inputTitle").getValue();
            var author = this.byId("inputAuthor").getValue();
            var language = this.byId("inputLanguage").getValue();
            var dateStart = this.byId("inputDateStart").getDateValue();
            var dateEnd = this.byId("inputDateEnd").getDateValue();

            var aFilter = [];
            var oList = this.getView().byId("idBooksTable");
            var oBinding = oList.getBinding("items");

            var valid = this.areFiltersValid(isbn, dateStart, dateEnd, language);
            if(valid) {
                if(isbn){
                    aFilter.push(new Filter("ISBN", FilterOperator.Contains, isbn));
                }
                if(author){
                    aFilter.push(new Filter("Author", FilterOperator.Contains, author));
                }
                if(title){
                    aFilter.push(new Filter("Title", FilterOperator.Contains, title));
                }
                if(dateStart && dateEnd){
                    var filter = new Filter("PublicationDate", FilterOperator.BT, dateStart, dateEnd)
                    aFilter.push(filter);
                }
                if(language){
                    aFilter.push(new Filter("Language", FilterOperator.Contains, language));
                }
                oBinding.filter(aFilter);
            }            
        },
        // validates the inputs from the modal
        areInputsValid(){
            var isValid = true;
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            if(this.book.ISBN.length != 13){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("isbnWarning"));
            }            
            else if(this.book.Title == ""){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("titleWarning"));
            }
            else if(this.book.Author == "") {
                isValid = false;
                MessageToast.show(oResourceBundle.getText("authorWarning"));
            }
            else if(this.book.AvailableNumber < 0 || this.book.TotalNumber < 0){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("numberGreaterThanZero"));
            }
            else if(this.book.Language.length != 2){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("languageCodeWarning"));
            }
            else if(this.book.AvailableNumber > this.book.TotalNumber){
                isValid = false;
                MessageToast.show(oResourceBundle.getText("availableVsTotalWarning"));
            }
            return isValid;
        },
        // called when the modal is closed
        onModalDestroy: function(oEvent) {
        },
        // called when pressing "Cancel" in modal
        onModalCancel(oEvent) {
            this.bookDialog.close();
        },
        // called when pressing "OK" in modal
        onModalOK(oEvent) {            
            var oModel = this.getView().getModel();
            var valid = this.areInputsValid();
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            if(valid) {
                var dateString = this.book.PublicationDate;
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "dd/MM/yyyy" });
                var TimeZoneOffSet = new Date(0).getTimezoneOffset() * 60 * 1000;
                var jsDate = new Date(dateFormat.parse(dateString).getTime() - TimeZoneOffSet).getTime();
                    
                // formatting the date to jsDate accepted by sap
                this.book.PublicationDate ="\/Date(" + jsDate + ")\/";

                if(this.addOperation) {
                    oModel.create('/Books', this.book, {
                        success: function() {
                            MessageToast.show(oResourceBundle.getText("success"));
                        },
                        error: function() {
                            MessageToast.show(oResourceBundle.getText("error"));
                        }});
                }
                else if(this.updateOperation){
                    const aSelContexts = this.byId("idBooksTable").getSelectedContexts();
                    if(aSelContexts.length != 0) {
                        const sPathToBook = aSelContexts[0].getPath();
                        oModel.update(sPathToBook, this.book, {
                            success: function() {
                                MessageToast.show(oResourceBundle.getText("success"));
                            },
                            error: function() {
                                MessageToast.show(oResourceBundle.getText("error"));
                            }});
                    }
                }

                this.bookDialog.close();
            }
        }
    });
 });