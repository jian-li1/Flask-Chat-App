const overlayBox = (content) => {
    return `
    <div class="overlay-content container-fluid" id="overlay-box">
        <div class="row">
            <div class="col-md-12">
                <div class="card" id="content-area">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12 mb-4 mb-md-0">${content}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

const newChatSearch = `
<div class="p-3">
    <form id="search-new-user" enctype="multipart/form-data">
        <div class="input-group mb-3 border-bottom">
            <input name="search" autocomplete="off" autofocus type="text" class="form-control rounded" placeholder="Search" aria-label="Search"/>
            <span class="input-group-text border-0 bg-transparent">
                <i class="bi bi-search"></i>
            </span>
        </div>
    </form>
    <div class="p-0" id="contact-result">
        <ul class="list-unstyled mb-0"></ul>
    </div>
</div>
`;

const deleteMsgConfirm = `
<div class="p-3">
    <h3>Delete conversation?</h3>
</div>
<div class="p-3 pt-1">
    <p>Deleting removes the conversation from your account, but is still visible to others.</p>
</div>
<div class="p-3 pt-1 d-flex justify-content-end">
    <button type="button" class="btn btn-light ms-3" id="cancel-delete">Cancel</button>
    <button type="button" class="btn btn-primary ms-3" id="confirm-delete-chat">Delete</button>
</div>
`

const messageBox = (name) => {
    return `
    <div class="ps-3 pt-3 pe-3">
        <div class="row align-items-center mb-3">
            <div class="col">
                <h3>${name}</h3>
            </div>
            <div class="col-auto action-icon ms-1">
                <i class="bi bi-info-circle" role="button" data-bs-toggle="dropdown" aria-expanded="false"></i>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li class="dropdown-item" role="button" id="delete-chat">Delete</li>
                </ul>
            </div>
        </div>
    </div>
    <div class="pt-3" id="msg-box"></div>
    <div class="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-3">
        <div class="textarea-container">
            <textarea type="text" class="form-control" rows="1" id="send-input" placeholder="Type message" autofocus></textarea>
        </div>
        <div class="dropup action-icon">
            <i class="bi bi-emoji-smile-fill ms-3" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false"></i>
            <div class="pickerContainer dropdown-menu dropdown-menu-end p-0" style="outline: none;"></div>
        </div>

        <span class="action-icon">
            <i class="bi bi-send-fill ms-3" role="button" id="send-btn"></i>
        </span>
    </div>
    `;
};

export { newChatSearch, messageBox, overlayBox, deleteMsgConfirm };