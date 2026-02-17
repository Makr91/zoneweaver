import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ZoneRegister = () => {
  const [frontendhost, setFrontendHost] = useState("");
  const [frontendport, setFrontendPort] = useState("3000");
  const [frontendproto, setFrontendProto] = useState("");

  const [backendhost, setBackendHost] = useState("");
  const [backendport, setBackendPort] = useState("");
  const [backendproto, setBackendProto] = useState("");

  const [backendcode, setBackendCode] = useState("");
  const [frontendcode, setFrontendCode] = useState("");

  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  // To Protect from Inadverntly destroying the Existing Configs, we Redirect to Login if It's been setup
  //    useEffect(() => {
  //       if ( configData.BACKEND_HOST !== undefined || configData.BACKEND_HOST !== null) {
  //                navigate("/");
  //        }
  //    });

  // If we have not yet been setup, we will send a request to the local API to register a host.
  const Register = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/setup", {
        backendhost,
        backendport,
        backendproto,
        frontendhost,
        frontendport,
        frontendproto,
        backendcode,
        frontendcode,
      });
      navigate("/register");
    } catch (error) {
      if (error.response) {
        setMsg(error.response.data.msg);
      }
    }
  };

  return (
    <section className="hero-body p-0  is-align-items-stretch has-background-gray">
      <div className="hero-body">
        <div className="container">
          <form onSubmit={Register} className="box" autoComplete="off">
            <div className="container">
              <div className="container">
                <div className="columns is-centered">
                  <div className="column is-4-desktop">
                    <div className="field mt-5">
                      <label className="label" htmlFor="backendproto">
                        Backend Host Protocol
                      </label>
                      <select
                        className="controls"
                        id="backendproto"
                        value={backendproto}
                        onChange={(e) => setBackendProto(e.target.value)}
                      >
                        <option value="http">http</option>
                        <option value="https">https</option>
                      </select>
                    </div>
                    <div className="field mt-5">
                      <label className="label" htmlFor="backendhost">
                        Backend Host Address
                      </label>
                      <div className="controls">
                        <input
                          id="backendhost"
                          type="text"
                          className="input"
                          placeholder="Backend Host"
                          value={backendhost}
                          onChange={(e) => setBackendHost(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field mt-5">
                      <label className="label" htmlFor="backendport">
                        Port
                      </label>
                      <div className="controls">
                        <input
                          id="backendport"
                          type="text"
                          className="input"
                          autoComplete="off"
                          placeholder="Port"
                          value={backendport}
                          onChange={(e) => setBackendPort(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field mt-5">
                      <label className="label" htmlFor="backendcode">
                        Backend Node Security Code
                      </label>
                      <div className="controls">
                        <input
                          id="backendcode"
                          autoComplete="new-password"
                          className="input"
                          type="password"
                          placeholder="******"
                          value={backendcode}
                          onChange={(e) => setBackendCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="column is-4-desktop">
                    <div className="field mt-5">
                      <label className="label" htmlFor="frontendproto">
                        Frontend Host Protocol
                      </label>
                      <div className="controls">
                        <input
                          id="frontendproto"
                          type="text"
                          className="input"
                          placeholder="Frontend Host Protocol"
                          value={frontendproto}
                          onChange={(e) => setFrontendProto(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field mt-5">
                      <label className="label" htmlFor="frontendhost">
                        Frontend Host Address
                      </label>
                      <div className="controls">
                        <input
                          id="frontendhost"
                          type="text"
                          className="input"
                          placeholder="Frontend Host"
                          value={frontendhost}
                          onChange={(e) => setFrontendHost(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field mt-5">
                      <label className="label" htmlFor="frontendport">
                        Port
                      </label>
                      <div className="controls">
                        <input
                          id="frontendport"
                          type="text"
                          className="input"
                          autoComplete="off"
                          placeholder="Port"
                          value={frontendport}
                          onChange={(e) => setFrontendPort(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field mt-5">
                      <label className="label" htmlFor="frontendcode">
                        Frontend Node Security Code
                      </label>
                      <div className="controls">
                        <input
                          id="frontendcode"
                          autoComplete="new-password"
                          className="input"
                          type="password"
                          placeholder="******"
                          onChange={(e) => setFrontendCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container">
                <div className="columns container is-centered">
                  <div className="column has-text-centered field mt-5">
                    <p className="has-text-centered">{msg}</p>
                    <button className="button is-primary">Register</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ZoneRegister;
