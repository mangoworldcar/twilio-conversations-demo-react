import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { ReactElement } from "react";
import { Client } from "@twilio/conversations";
import { Box, Spinner } from "@twilio-paste/core";

import Login from "./login/login";
import AppContainer from "./AppContainer";
import { actionCreators, AppState } from "../store";
import { getToken } from "../api";

function App(): ReactElement {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { login } = bindActionCreators(actionCreators, dispatch);
  const token = useSelector((state: AppState) => state.token);

  const username = localStorage.getItem("username") ?? "";
  const password = localStorage.getItem("password") ?? "";

  const joinAllConversation = async (client: Client, conversations: []) => {
    try {
      for (const conversationObj of conversations) {
        console.log(conversationObj);
        const { sid } = conversationObj; // 객체에서 sid 추출
        console.log(`Processing conversation with SID: ${sid}`);
        const conversation = await client.getConversationBySid(sid);
        if (conversation.status !== "joined") {
          await conversation.join();
          console.log(`Joined conversation with SID: ${conversation.sid}`);
        } else {
          console.log(
            `Already joined conversation with SID: ${conversation.sid}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to join conversation:", error);
    }
  };

  useEffect(() => {
    if (username.length > 0 && password.length > 0) {
      getToken(username, password)
        .then(async (data) => {
          login(data.token);
          const client = new Client(data.token);

          await joinAllConversation(client, data.conversations);
        })
        .catch(() => {
          localStorage.setItem("username", "");
          localStorage.setItem("password", "");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const setToken = (token: string) => {
    login(token);
    setLoading(false);
  };

  if ((!token && !loading) || !username || !password) {
    return <Login setToken={setToken} />;
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        height="100%"
        width="100%"
      >
        <Spinner size="sizeIcon110" decorative={false} title="Loading" />
      </Box>
    );
  }

  return <AppContainer />;
}

export default App;
