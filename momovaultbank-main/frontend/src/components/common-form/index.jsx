import PropTypes from "prop-types";

const CommonForm = ({
  formControls,
  formData,
  setFormData,
  buttonText,
  isButtonDisabled,
  handleSubmit,
}) => {
  function handleChange(e, name) {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formControls.map((control) => (
        <div key={control.name} className="flex flex-col space-y-1">
          <label htmlFor={control.name} className="font-medium text-sm">
            {control.label}
          </label>
          <input
            type={control.type}
            name={control.name}
            id={control.name}
            placeholder={control.placeholder}
            value={formData[control.name] || ""}
            onChange={(e) => handleChange(e, control.name)}
            className="border rounded px-3 py-2"
            required={control.required}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={isButtonDisabled}
        className={`w-full py-2 rounded-md font-semibold text-white ${
          isButtonDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {buttonText}
      </button>
    </form>
  );
};

CommonForm.propTypes = {
  formControls: PropTypes.array.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  buttonText: PropTypes.string.isRequired,
  isButtonDisabled: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default CommonForm;
