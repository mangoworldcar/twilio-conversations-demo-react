import { useState, useEffect } from "react";
import { Button } from "@twilio-paste/button";
import { Box } from "@twilio-paste/core";

import { getToken } from "../../api";
import { InputType } from "../../types";
import ModalInputField from "../modals/ModalInputField";
import styles from "../../styles";
import TwilioLogo from "../icons/TwilioLogo";
import React from "react";

type SetTokenType = (token: string) => void;

interface LoginProps {
  setToken: SetTokenType;
}

async function login(
  username: string,
  password: string,
  setToken: (token: string) => void
): Promise<string> {
  try {
    const data = await getToken(username.trim(), password);
    if (data.token === "") {
      return "Received an empty token from backend.";
    }

    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    setToken(data.token);

    return "";
  } catch (error) {
    let message = "Unknown Error";
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    return message;
  }
}

const Login: React.FC<LoginProps> = (props: LoginProps) => {
  const [isFormDirty, setFormDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const [, AlertsView] = useAppAlert();

  const handleLogin = async () => {
    const error = await login(username, password, props.setToken);
    if (error) {
      setFormError(error);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        handleLogin();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyPress);
      abortController.abort();
    };
  }, [password, username]);

  return (
    <Box style={styles.loginContainer}>
      {/* <AlertsView /> */}
      <Box style={styles.loginContent}>
        <Box>
          {/* <ProductConversationsIcon
            decorative={true}
            size="sizeIcon90"
            color="colorTextInverse"
          /> */}
          <img
            src="https://mangoworldcar.com/_next/image?url=%2Fassets%2Fimages%2Fpng%2Flogo_white.png&w=256&q=75"
            alt="Mango Conversations Logo"
          />
        </Box>
        <div style={styles.subTitle}></div>
        <Box style={styles.loginForm}>
          <Box style={styles.userInput}>
            <ModalInputField
              label="Username"
              placeholder=""
              isFocused={true}
              error={
                isFormDirty && !username.trim()
                  ? "Enter a username to sign in."
                  : ""
              }
              input={username}
              onChange={(username: string) => {
                setUsername(username);
                setFormError("");
              }}
              onBlur={() => {
                if (password) {
                  setFormDirty(true);
                }
              }}
              id="username"
            />
          </Box>
          <Box style={styles.passwordInput}>
            <ModalInputField
              label="Password"
              placeholder=""
              error={
                isFormDirty && !password
                  ? "Enter a password to sign in."
                  : formError ?? ""
              }
              input={password}
              onChange={(password: string) => {
                setPassword(password);
                setFormError("");
              }}
              onBlur={() => setFormDirty(true)}
              inputType={showPassword ? InputType.Text : InputType.Password}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              id="password"
            />
          </Box>
          <Box style={styles.loginButton}>
            <Button
              fullWidth
              disabled={!username || !password}
              variant="primary"
              onClick={handleLogin}
              id="login"
            >
              Sign in
            </Button>
          </Box>
        </Box>
        <Box style={{ paddingTop: 40 }}>
          <TwilioLogo />
        </Box>
      </Box>
      <Box style={styles.loginBackground}>
        <Box
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: "#06033a",
            transform: "skewY(-12deg)",
            transformOrigin: "top right",
          }}
        />
      </Box>
    </Box>
  );
};

export default Login;
