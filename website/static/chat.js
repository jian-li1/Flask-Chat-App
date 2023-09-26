import { newChatSearch, messageBox, overlayBox, deleteMsgConfirm } from "./elements.js";

const socketio = io();
let lastSentBy;

const chatBubble = (data) => {
    const attr = {
        "recipient": {padding: "ps-2", margin: "ms-3", align: "justify-content-start", msg: "recipient-msg", color: ""},
        "sender": {padding: "pe-2", margin: "me-3", align: "justify-content-end", msg: "sender-msg", color: "text-white bg-primary"}
    };
    const userRole = attr[data.user_role];
    const name = (data.user_role == "recipient") ? data.name : "You";
    let headers = `
    <div class="d-flex flex-row ${userRole.align}">
        <p class="small ${userRole.padding} ${userRole.margin} mb-1 rounded-3 text-muted"><b>${name}</b></p>
    </div>
    `;
    let body = `
    <div class="d-flex flex-row ${userRole.align}">
        <p class="p-2 ${userRole.margin} mb-1 rounded-4 ${userRole.msg} ${userRole.color}">
            ${data.text}
        </p>
    </div>
    `;

    if ((lastSentBy) && lastSentBy == name) {
        headers = "";
    }
    lastSentBy = name;

    if (hasOnlyEmojis(data.text)) {
        body = `
        <div class="d-flex flex-row ${userRole.align}">
            <h3 class="p-2 ${userRole.margin} mb-1 rounded-4 ${userRole.msg} ${userRole.color}">
                ${data.text}
            </h3>
        </div>
        `;
    }

    return `<div>${headers}${body}</div>`;
}

const hasOnlyEmojis = (text) => {
    const emojiPattern = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]/;
    for (const char of text) {
        if (!emojiPattern.test(char)) {
            return false;
        }
    }
    return true;
}

const createContactCard = (data) => {
    const contactCard = document.createElement("li");
    contactCard.classList.add("p-2", "border-bottom", "contact-card", "selected");
    contactCard.innerHTML = `
    <a href="/chat/${data.chat_id}" data-list-item-id="chat_id_${data.chat_id}" class="d-flex justify-content-between">
        <div class="d-flex flex-row">
            <div class="pt-1">
                <p class="fw-bold text-dark mb-0 contact-name">${data.name}</p>
                <p class="small text-muted msg-preview"></p>
            </div>
        </div>
    </a>
    `;
    const unorderedList = document.querySelector("#contact-list").querySelector("ul");
    unorderedList.insertBefore(contactCard, unorderedList.firstChild);

    contactList[contactCard.querySelector("a").getAttribute("data-list-item-id")] = contactCard;
    setCardBehavior(contactCard);
};

const setCardBehavior = (contact) => {
    const link = contact.querySelector("a");
    const chatUrl = link.getAttribute("href");
    const chatID = link.getAttribute("data-list-item-id");
    link.addEventListener("click", (event) => {
        event.preventDefault();

        if (chatUrl == window.location.pathname) 
            return;
        const currentContact = document.querySelector(".selected");
        if (currentContact) 
            currentContact.classList.remove("selected");
        contact.classList.add("selected");

        history.pushState({"chat_id": chatID}, "", chatUrl);
        displayChat();

    });
};

let timeoutId;

const existingUserSearch = document.querySelector("#search-user");
existingUserSearch.addEventListener("input", () => {
    const searchInput = existingUserSearch.value.toUpperCase().trim();
    for (const contact of Object.values(contactList)) {
        let name = contact.querySelector('.contact-name');
        name = name.textContent || name.innerHTML;
        
        if (name.toUpperCase().indexOf(searchInput) > -1) {
            contact.classList.remove("d-none");
        }
        else {
            contact.classList.add("d-none");
        }
    }
});

const searchNewUser = () => {
    const form = document.querySelector("#search-new-user");
    const newUserSearch = form.querySelector("input");
    newUserSearch.focus();
    newUserSearch.addEventListener("input", () => {
        const formData = new FormData(form);
        clearTimeout(timeoutId);
        const resultList = document.querySelector("#contact-result ul");
        if (newUserSearch.value == "") {
            resultList.innerHTML = "";
            return;
        }

        timeoutId = setTimeout(() => {
            fetch("/chat/add-user", {
                method: "POST",
                body: formData,
                headers: {"X-Requested-With": "XMLHttpRequest"}
            })
                .then(response => {
                    if (!response.ok)
                        throw new Error(`Response status code: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    resultList.innerHTML = "";
                    for (const contact of data.result) {
                        const contactCard = document.createElement("li");
                        contactCard.classList.add("p-2", "border-bottom", "contact-card");
                        contactCard.setAttribute("role", "button");
                        const userInfo = `
                        <div class="d-flex flex-row">
                            <div class="pt-1">
                                <span class="fw-bold text-dark mb-0">${contact.name}</span>
                                <span class="small text-muted msg-preview">${contact.username}</span>
                            </div>
                        </div>
                        `;
                        contactCard.innerHTML = userInfo;
                        contactCard.addEventListener("click", (event) => {
                            event.preventDefault();
                            startNewChat(contact.username);
                        });
                        resultList.appendChild(contactCard);
                    }
                })
                .catch(error => console.error(error));
        }, 1000);
    });
}

const startNewChat = (username) => {
    document.querySelector("#search-user").value = "";
    document.querySelector("#search-user").dispatchEvent(new Event("input", {}));
    const overlayDiv = document.querySelector(".overlay");
    overlayDiv.remove();

    const formData = new FormData();
    formData.append("username", username);
    
    fetch("/start-chat", {
        method: "POST",
        body: formData,
        headers: {"X-Requested-With": "XMLHttpRequest"}
    })
        .then(response => {
            if (!response.ok)
                throw new Error(`Response status code: ${response.status}`);
            return response.json();
        })
        .then(data => {
            history.pushState({"chat_id": `chat_id_${data.chat_id}`}, "", `/chat/${data.chat_id}`);
            document.querySelectorAll(".contact-card").forEach(contact => contact.classList.remove("selected"));
            if (data.new_chat)
                createContactCard(data);
            else {
                if (!contactList.hasOwnProperty(`chat_id_${data.chat_id}`)) {
                    createContactCard({chat_id: data.chat_id, name: data.name});
                }
                contactList[`chat_id_${data.chat_id}`].classList.add("selected");
            }
            displayChat();
        })
        .catch(error => console.error(error));
};

const displayChat = async () => {
    previewMessage();
    const rightCol = document.querySelector("#right-col");
    const leftCol = document.querySelector("#left-col");

    rightCol.classList.remove("d-none", "d-md-block");
    leftCol.classList.add("d-none", "d-md-block");

    await fetch(window.location.pathname, {
        method: "GET",
        headers: {"X-Requested-With": "XMLHttpRequest"}
    })
        .then(response => {
            if (!response.ok)
                throw new Error(`Response status code: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!contactList.hasOwnProperty(`chat_id_${data.chat_id}`)) {
                createContactCard({chat_id: data.chat_id, name: data.recipient.name});
                contactList[`chat_id_${data.chat_id}`].classList.add("selected");
            }

            if (window.location.pathname == "/chat") {
                clearChat();
                return;
            }

            rightCol.innerHTML = messageBox(data.recipient.name);
            const messageContainer = document.querySelector("#msg-box");

            const textBox = document.querySelector("#send-input");
            const sendBtn = document.querySelector("#send-btn");
            textBox.focus();
            
            sendBtn.addEventListener("click", () => {
                sendMessage(textBox, data.recipient.user_id, data.chat_id);
                textBox.dispatchEvent(new Event("input", {}));
            });

            document.addEventListener("keydown", (event) => {
                if (!event.shiftKey && event.key === "Enter") {
                    event.preventDefault(); 
                    sendMessage(textBox, data.recipient.user_id, data.chat_id);
                    textBox.dispatchEvent(new Event("input", {}));
                }
            });
            
            textBox.addEventListener("input", () => { 
                textBox.style.height = "auto"; // Reset the height to auto
                textBox.style.height = textBox.scrollHeight + "px"; // Set the new height
                if (textBox.scrollHeight > 36) {
                    textBox.parentNode.parentNode.classList.remove("pt-3", "mt-3");
                    textBox.parentNode.parentNode.classList.add("pt-1", "mt-2");
                }
                else {
                    textBox.parentNode.parentNode.classList.remove("pt-1", "mt-2");
                    textBox.parentNode.parentNode.classList.add("pt-3", "mt-3");
                }
            });

            socketio.on("new_message", (msgData) => {
                if (msgData.chat_id == data.chat_id) {
                    // console.log(`Inside chat: ${msgData.text} in chat ${msgData.chat_id}`);
                    messageContainer.innerHTML += chatBubble(msgData);
                    messageContainer.scrollTop = messageContainer.scrollHeight;
                }
            });

            data.messages.forEach(msg => messageContainer.innerHTML += chatBubble(msg));
            messageContainer.scrollTop = messageContainer.scrollHeight;

            document.querySelector("#delete-chat").addEventListener("click", () => confirmDeleteChat(data.chat_id));

            const rootElement = document.querySelector(".pickerContainer");
            const picker = picmo.createPicker({ rootElement });
            picker.addEventListener('emoji:select', event => document.querySelector("#send-input").value += event.emoji);
        })
        .catch(error => console.error(error));
};

const clearChat = () => {
    const rightCol = document.querySelector("#right-col");
    const leftCol = document.querySelector("#left-col");

    rightCol.innerHTML = null;
    leftCol.classList.remove("d-none", "d-md-block");
    rightCol.classList.add("d-none", "d-md-block");
}

const confirmDeleteChat = (chat_id) => {
    // Create the overlay div element
    const overlayDiv = document.createElement("div");
    overlayDiv.classList.add("overlay");
    document.body.insertBefore(overlayDiv, document.body.firstChild);

    document.querySelector(".overlay").innerHTML = overlayBox(deleteMsgConfirm);

    const overlay = document.querySelector("#overlay-box");
    overlayDiv.addEventListener("click", (event) => {
        if (!overlay.contains(event.target)) 
            overlayDiv.remove();
    });

    document.querySelector("#cancel-delete").addEventListener("click", () => overlayDiv.remove());
    document.querySelector("#confirm-delete-chat").addEventListener("click", (event) => {
        event.preventDefault();
        overlayDiv.remove();
        const formData = new FormData();
        formData.append("chat_id", chat_id);

        fetch("/delete-chat", {
            method: "POST",
            body: formData,
            headers: {"X-Requested-With": "XMLHttpRequest"}
        })
            .then((response) => {
                if (!response.ok)
                    throw new Error(`Response status code: ${response.status}`);
                
            })
            .catch(error => console.error(error));

        history.pushState({}, "", "/chat");
        clearChat();

        contactList[`chat_id_${chat_id}`].remove();
        delete contactList[`chat_id_${chat_id}`];
    });
};

const previewMessage = () => {
    socketio.off("new_message");
    socketio.on("new_message", (msgData) => {
        if (!contactList.hasOwnProperty(`chat_id_${msgData.chat_id}`)) {
            createContactCard({chat_id: msgData.chat_id, name: msgData.name});
            contactList[`chat_id_${msgData.chat_id}`].classList.remove("selected");
        }
        contactList[`chat_id_${msgData.chat_id}`].querySelector(".msg-preview").innerHTML = msgData.text;
        const unorderedList = document.querySelector("#contact-list ul");
        unorderedList.insertBefore(contactList[`chat_id_${msgData.chat_id}`], unorderedList.firstChild);
        // console.log(`${msgData.text} in chat ${msgData.chat_id}`);
    });  
};

const sendMessage = (textBox, userId, chatId) => {
    const textValue = textBox.value;
    if (textValue.trim() == "") 
        return;
    socketio.emit("new_message", { recipient_id: userId, chat_id: chatId, text: textValue });
    textBox.value = "";
    textBox.focus();
};

const contactList = {};
document.querySelectorAll(".contact-card").forEach((contact) => {
    const link = contact.querySelector("a");
    contactList[link.getAttribute("data-list-item-id")] = contact;
    setCardBehavior(contact);
});

const newMessage = document.querySelector("#new-message")
newMessage.addEventListener("click", () => {
    // Create the overlay div element
    const overlayDiv = document.createElement("div");
    overlayDiv.classList.add("overlay");
    document.body.insertBefore(overlayDiv, document.body.firstChild);

    document.querySelector(".overlay").innerHTML = overlayBox(newChatSearch);

    const newMessageBox = document.querySelector("#overlay-box");
    overlayDiv.addEventListener("click", (event) => {
        if (!newMessageBox.contains(event.target)) 
            overlayDiv.remove();
    });

    searchNewUser();
});

window.addEventListener("popstate", (event) => {
    document.querySelectorAll(".contact-card").forEach(contact => contact.classList.remove("selected"));
    if (window.location.pathname == "/chat") {
        clearChat();
        return;
    }

    if (event.state && contactList.hasOwnProperty(event.state.chat_id)) {
        contactList[event.state.chat_id].classList.add("selected");
    }
    displayChat();
});

document.addEventListener("DOMContentLoaded", () => {
    previewMessage();
    if (window.location.pathname == "/chat") {
        clearChat();
        return;
    }
    displayChat();
});