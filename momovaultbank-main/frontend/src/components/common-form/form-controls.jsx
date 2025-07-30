import PropTypes from "prop-types";

function CommonForm({
  formControls,
  formData,
  setFormData,
  handleSubmit,
  buttonText,
  isButtonDisabled,
}) {
  function handleInputChange(e, field) {
    setFormData({ ...formData, [field.name]: e.target.value });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-4"
    >
      {formControls.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
          </label>
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleInputChange(e, field)}
            placeholder={field.placeholder}
            className="mt-1 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isButtonDisabled}
        className={`w-full py-2 px-4 text-white font-semibold rounded-md transition ${
          isButtonDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {buttonText}
      </button>
    </form>
  );
}

CommonForm.propTypes = {
  formControls: PropTypes.array.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  buttonText: PropTypes.string.isRequired,
  isButtonDisabled: PropTypes.bool.isRequired,
};

export default CommonForm;
