﻿// Write your JavaScript code.
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/websubclienthub")
    .configureLogging(signalR.LogLevel.Information)
    .build();

connection.on("notification", (message) => {
    console.debug(message);

    $(".topic").val(message.event["hub.topic"]);
    $(".event").val(message.event["hub.event"]);

    for (var i = 0; i < message.event.context.length; i++) {
        var context = message.event.context[i];
        if (context.key === "patient") {
            $(".patient-identifier").val(context.resource.id);
        }
        if (context.key === "study") {
            $(".study-id").val(context.resource.id);
        }
    }
});

connection.on("subscribed", (subscription, hubURL) => {
    console.debug(subscription);
    console.debug("HubURL: " + hubURL);

    var myTable = document.getElementById("clientSubTable");
    var newRow = myTable.insertRow(myTable.rows.length);

    var urlCell = newRow.insertCell(0);
    var topicCell = newRow.insertCell(1);
    var eventCell = newRow.insertCell(2);
    var contextCell = newRow.insertCell(3);
    var unsubscribeCell = newRow.insertCell(4);

    var urlText = document.createTextNode(hubURL);
    var topicText = document.createTextNode(subscription.topic);
    var eventsText = document.createTextNode(subscription.events.join(","));
    var unsubscribeBtn = document.createElement('input');
    unsubscribeBtn.type = "button";
    unsubscribeBtn.className = "btn btn-danger";
    unsubscribeBtn.value = "Unsubscribe";
    unsubscribeBtn.id = "unsub";
    unsubscribeBtn.onclick = (function (topic) {
        return function () {
            unsubscribe(subscription.topic);
        };
    })(subscription.topic);

    var contextBtn= document.createElement('input');
    contextBtn.type = "button";
    contextBtn.className = "btn btn-primary";
    contextBtn.value = "Get Context";
    contextBtn.id = "getContext";
    contextBtn.onclick = (function (topic) {
        return function () {
            getContext(subscription.topic);
        };
    })(subscription.topic);

    urlCell.appendChild(urlText);
    topicCell.appendChild(topicText);
    eventCell.appendChild(eventsText);
    contextCell.appendChild(contextBtn);
    unsubscribeCell.appendChild(unsubscribeBtn);
});

connection.on("error", (errorMsg) => {
    alert("Error on server: " + errorMsg);
});

connection
    .start()
    .catch(err => console.error(err.toString()));

function unsubscribe(topic) {
    console.debug("unsubscribing from " + topic);

    connection
        .invoke(
            "unsubscribe", topic)
        .catch(e => console.error(e));
}

function getContext(topic) {
    console.debug("getting context for " + topic);

    connection
        .invoke(
            "getContext", topic)
        .catch(e => console.error(e));
}

function addHttpHeader() {
    var tbl = document.getElementById("tblHttpHeaders");

    var newRow = tbl.insertRow(tbl.rows.length);

    var nameCell = newRow.insertCell();
    var valueCell = newRow.insertCell();

    var nameText = document.createElement('input');
    nameText.type = "text";

    var valueText = document.createElement('input');
    valueText.type = "text";

    nameCell.appendChild(nameText);
    valueCell.appendChild(valueText);
}

$("#subscribe").submit(function (e) {
    let form = $(this);
    let url = form.attr("action");

    console.debug("subscribing to " + this["subscriptionUrl"].value);

    var tbl = document.getElementById("tblHttpHeaders");
    let headers = [];
    for (var i = 0; i < tbl.rows.length; i++) {
        if (tbl.rows[i].cells[0].children[0].value === "") {
            continue;
        }
        headers[i] = tbl.rows[i].cells[0].children[0].value + ":" + tbl.rows[i].cells[1].children[0].value;
    }

    let eventChkBoxes = ["chkOpenPatient", "chkClosePatient", "chkOpenStudy", "chkCloseStudy"];
    let events = "";
    for (var i = 0; i < eventChkBoxes.length; i++) {
        if (this[eventChkBoxes[i]].checked) {
            if (events === "") {
                events = this[eventChkBoxes[i]].value;
            } else {
                events += "," + this[eventChkBoxes[i]].value;
            }
        }
    }
    if (this["events"].value !== "") {
        if (events === "") {
            events = this["events"].value;
        } else {
            events += "," + this["events"].value;
        }
    }

    connection
        .invoke(
            "subscribe",
            this["subscriptionUrl"].value,
            this["topic"].value,
            events,
            headers)
        .catch(e => console.error(e));

    e.preventDefault();
});

$("#unsubscribe").submit(function (e) {
    console.debug("unsubscribe param: " + e);
    let form = $(this);
    let topic = form[0].attributes("action");

    console.debug("unsubscribing from " + topic);

    connection
        .invoke(
            "unsubscribe", topic)
        .catch(e => console.error(e));

    e.preventDefault();
});
$("#getContext").submit(function (e) {
    console.debug("getting context: " + e);
    let form = $(this);
    let topic = form[0].attributes("action");

    console.debug("context for " + topic);

    connection
        .invoke(
            "getContext", topic)
        .catch(e => console.error(e));

    e.preventDefault();
});