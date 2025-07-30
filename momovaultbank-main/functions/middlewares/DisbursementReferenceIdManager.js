
let disbursementReferenceId = null;

function setReferenceId(id) {
  disbursementReferenceId = id;
}

function getReferenceId() {
  return disbursementReferenceId;
}

module.exports = {
  setReferenceId,
  getReferenceId,
};
