
let globlalReferenceId = null;

function setReferenceId(referenceId) {
    globlalReferenceId = referenceId;
}

function getReferenceId() {
    return globlalReferenceId;
}

module.exports = {
    setReferenceId,
    getReferenceId,
};