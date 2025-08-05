import React, { createContext, useState } from "react";

const UserAuth = createContext();

const UserAuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [expire, setExpire] = useState(null);
  const [name, setName] = useState(null);
  const [userid, setUserID] = useState(null);
  const [group, setGroup] = useState(null);

  return <UserAuth.Provider value={{ token, expire, name, group, userid, setToken, setExpire, setName, setGroup, setUserID }}>{children}</UserAuth.Provider>;
};

export { UserAuth, UserAuthProvider };
