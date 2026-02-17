import PropTypes from "prop-types";

import LdapTestPanel from "./LdapTestPanel";
import OidcProviderPanel from "./OidcProviderPanel";
import SmtpTestPanel from "./SmtpTestPanel";

const TestingPanel = ({
  values,
  testResults,
  setTestResults,
  testLoading,
  setTestLoading,
  testEmail,
  setTestEmail,
  ldapTestCredentials,
  setLdapTestCredentials,
  showOidcProviderModal,
  setShowOidcProviderModal,
  oidcProviderForm,
  setOidcProviderForm,
  oidcProviderLoading,
  setOidcProviderLoading,
  setMsg,
  loading,
  section,
  sectionName,
  resetOidcProviderForm,
}) => (
  <>
    {sectionName === "Authentication" && (
      <LdapTestPanel
        values={values}
        testResults={testResults}
        setTestResults={setTestResults}
        testLoading={testLoading}
        setTestLoading={setTestLoading}
        ldapTestCredentials={ldapTestCredentials}
        setLdapTestCredentials={setLdapTestCredentials}
        setMsg={setMsg}
        loading={loading}
      />
    )}

    {sectionName === "Authentication" && (
      <OidcProviderPanel
        values={values}
        section={section}
        showOidcProviderModal={showOidcProviderModal}
        setShowOidcProviderModal={setShowOidcProviderModal}
        oidcProviderForm={oidcProviderForm}
        setOidcProviderForm={setOidcProviderForm}
        oidcProviderLoading={oidcProviderLoading}
        setOidcProviderLoading={setOidcProviderLoading}
        resetOidcProviderForm={resetOidcProviderForm}
        setMsg={setMsg}
        loading={loading}
      />
    )}

    {sectionName === "Mail" && (
      <SmtpTestPanel
        testResults={testResults}
        setTestResults={setTestResults}
        testLoading={testLoading}
        setTestLoading={setTestLoading}
        testEmail={testEmail}
        setTestEmail={setTestEmail}
        setMsg={setMsg}
        loading={loading}
      />
    )}
  </>
);

TestingPanel.propTypes = {
  values: PropTypes.object.isRequired,
  testResults: PropTypes.object.isRequired,
  setTestResults: PropTypes.func.isRequired,
  testLoading: PropTypes.object.isRequired,
  setTestLoading: PropTypes.func.isRequired,
  testEmail: PropTypes.string.isRequired,
  setTestEmail: PropTypes.func.isRequired,
  ldapTestCredentials: PropTypes.shape({
    testUsername: PropTypes.string,
    testPassword: PropTypes.string,
  }).isRequired,
  setLdapTestCredentials: PropTypes.func.isRequired,
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
  setMsg: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  section: PropTypes.object.isRequired,
  sectionName: PropTypes.string.isRequired,
  resetOidcProviderForm: PropTypes.func.isRequired,
};

export default TestingPanel;
