import axios from "axios";
import PropTypes from "prop-types";
import { useCallback } from "react";

import { FormModal } from "../common";

import OidcProviderForm from "./OidcProviderForm";

const OidcProviderPanel = ({
  values,
  section,
  showOidcProviderModal,
  setShowOidcProviderModal,
  oidcProviderForm,
  setOidcProviderForm,
  oidcProviderLoading,
  setOidcProviderLoading,
  resetOidcProviderForm,
  setMsg,
  loading,
}) => {
  const handleOidcProviderFormChange = useCallback(
    (field, value) => {
      setOidcProviderForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setOidcProviderForm]
  );

  const addOidcProvider = useCallback(
    async (e) => {
      e.preventDefault();
      const {
        name,
        displayName,
        issuer,
        clientId,
        clientSecret,
        scope,
        responseType,
        enabled,
      } = oidcProviderForm;

      if (!name || !displayName || !issuer || !clientId || !clientSecret) {
        setMsg(
          "Provider name, display name, issuer, client ID, and client secret are required"
        );
        return;
      }

      if (!/^[a-z0-9_]+$/i.test(name)) {
        setMsg(
          "Provider name must contain only letters, numbers, and underscores"
        );
        return;
      }

      const existingProviderPath = `authentication.oidc_providers.${name}`;
      if (values[`${existingProviderPath}.enabled`] !== undefined) {
        setMsg(`OIDC provider &apos;${name}&apos; already exists`);
        return;
      }

      try {
        setOidcProviderLoading(true);
        setMsg("Adding OIDC provider...");

        const providerSettings = {
          [`${existingProviderPath}.enabled`]: enabled,
          [`${existingProviderPath}.display_name`]: displayName,
          [`${existingProviderPath}.issuer`]: issuer,
          [`${existingProviderPath}.client_id`]: clientId,
          [`${existingProviderPath}.client_secret`]: clientSecret,
          [`${existingProviderPath}.scope`]: scope,
          [`${existingProviderPath}.response_type`]: responseType,
        };

        const response = await axios.put("/api/settings", {
          ...values,
          ...providerSettings,
        });

        if (response.data.success) {
          setMsg(
            `OIDC provider &apos;${name}&apos; added successfully. Refreshing...`
          );
          setShowOidcProviderModal(false);
          resetOidcProviderForm();
          window.location.reload();
        } else {
          setMsg(
            `Failed to add OIDC provider: ${response.data.message || "Unknown error"}`
          );
        }
      } catch (error) {
        console.error("Error adding OIDC provider:", error);
        setMsg(
          `Error adding OIDC provider: ${error.response?.data?.message || error.message}`
        );
      } finally {
        setOidcProviderLoading(false);
      }
    },
    [
      oidcProviderForm,
      values,
      setMsg,
      setOidcProviderLoading,
      setShowOidcProviderModal,
      resetOidcProviderForm,
    ]
  );

  return (
    <>
      {/* OIDC Provider Management Section */}
      <div className="box mt-4 has-background-light">
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h3 className="title is-6">
              <span className="icon is-small mr-2">
                <i className="fab fa-openid" />
              </span>
              OIDC Providers
            </h3>
          </div>
          <div className="level-right">
            <button
              className="button is-primary is-small"
              onClick={(e) => {
                e.stopPropagation();
                resetOidcProviderForm();
                setShowOidcProviderModal(true);
              }}
              disabled={loading}
            >
              <span className="icon is-small">
                <i className="fas fa-plus" />
              </span>
              <span>Add OIDC Provider</span>
            </button>
          </div>
        </div>

        <p className="has-text-grey is-size-7 mb-3">
          Manage OpenID Connect authentication providers for single sign-on
          integration.
        </p>

        {Object.entries(section.subsections || {}).length > 0 ? (
          <div className="notification is-info is-light">
            <p className="is-size-7">
              <strong>
                {Object.entries(section.subsections || {}).length}
              </strong>{" "}
              OIDC provider(s) configured. You can expand each provider section
              below to modify settings.
            </p>
          </div>
        ) : (
          <div className="notification is-warning is-light">
            <p className="is-size-7">
              No OIDC providers configured yet. Click &quot;Add OIDC
              Provider&quot; to set up authentication with providers like
              Google, Microsoft, GitHub, etc.
            </p>
          </div>
        )}
      </div>

      {/* OIDC Provider Modal */}
      {showOidcProviderModal && (
        <FormModal
          isOpen={showOidcProviderModal}
          onClose={() => setShowOidcProviderModal(false)}
          onSubmit={addOidcProvider}
          title="Add OIDC Provider"
          icon="fab fa-openid"
          submitText={oidcProviderLoading ? "Adding..." : "Add Provider"}
          submitVariant="is-primary"
          loading={oidcProviderLoading}
        >
          <OidcProviderForm
            oidcProviderForm={oidcProviderForm}
            handleOidcProviderFormChange={handleOidcProviderFormChange}
            oidcProviderLoading={oidcProviderLoading}
          />
        </FormModal>
      )}
    </>
  );
};

OidcProviderPanel.propTypes = {
  values: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  showOidcProviderModal: PropTypes.bool.isRequired,
  setShowOidcProviderModal: PropTypes.func.isRequired,
  oidcProviderForm: PropTypes.shape({
    name: PropTypes.string,
    displayName: PropTypes.string,
    issuer: PropTypes.string,
    clientId: PropTypes.string,
    clientSecret: PropTypes.string,
    scope: PropTypes.string,
    responseType: PropTypes.string,
    enabled: PropTypes.bool,
  }).isRequired,
  setOidcProviderForm: PropTypes.func.isRequired,
  oidcProviderLoading: PropTypes.bool.isRequired,
  setOidcProviderLoading: PropTypes.func.isRequired,
  resetOidcProviderForm: PropTypes.func.isRequired,
  setMsg: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default OidcProviderPanel;
