import PropTypes from "prop-types";

import FieldRenderer from "../FieldRenderer";

const StandardSectionRenderer = ({
  section,
  values,
  sslFiles,
  uploadingFiles,
  loading,
  onFieldChange,
  onSslFileUpload,
}) => (
  <div className="columns is-multiline">
    {section.fields.map((field) => (
      <div
        key={field.path}
        className={
          field.type === "textarea" || field.type === "array"
            ? "column is-full"
            : "column is-half"
        }
      >
        <FieldRenderer
          field={field}
          values={values}
          sslFiles={sslFiles}
          uploadingFiles={uploadingFiles}
          loading={loading}
          onFieldChange={onFieldChange}
          onSslFileUpload={onSslFileUpload}
        />
      </div>
    ))}
  </div>
);

StandardSectionRenderer.propTypes = {
  section: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  sslFiles: PropTypes.object.isRequired,
  uploadingFiles: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSslFileUpload: PropTypes.func.isRequired,
};

export default StandardSectionRenderer;
