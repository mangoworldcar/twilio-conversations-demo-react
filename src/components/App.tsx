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
import parsePhoneNumber from "libphonenumber-js";

function App(): ReactElement {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { login } = bindActionCreators(actionCreators, dispatch);
  const token = useSelector((state: AppState) => state.token);

  const username = localStorage.getItem("username") ?? "";
  const password = localStorage.getItem("password") ?? "";

  const joinAllConversation = async (
    client: Client,
    conversations: { sid: string; attributes: string }[]
  ) => {
    try {
      for (const convo of conversations) {
        const { sid } = convo;
        const conversation = await client.peekConversationBySid(sid);
        const messages = await conversation.getMessages();
        const number = messages.items[0].author
          ? parsePhoneNumber("+" + messages.items[0].author?.split("+")[1])
          : null;

        const author =
          number?.formatInternational() + " " + number?.country ?? sid;
        await conversation.updateFriendlyName(author);

        await conversation.join();
      }
    } catch (error) {
      console.error("Failed to join conversation:", error);
    }
  };

  function findUnsubscribedSids(
    allConversations: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { token?: string; conversations: any[] }
  ) {
    // subscribedConvo.items의 sid를 Set으로 저장
    const subscribedSids = new Set(allConversations.map((item) => item.sid));

    // data.conversations의 sid 중 subscribedSids에 없는 sid 찾기
    const unsubscribedSids = data.conversations.filter(
      (convo) => !subscribedSids.has(convo.sid)
    );

    return unsubscribedSids;
  }

  useEffect(() => {
    if (username.length > 0 && password.length > 0) {
      getToken(username, password)
        .then(async (data) => {
          login(data.token);
          const client = new Client(data.token);
          let allConversations: any[] = [];
          let page = await client.getSubscribedConversations();

          allConversations = allConversations.concat(page.items);

          while (page.hasNextPage) {
            page = await page.nextPage();
            allConversations = allConversations.concat(page.items);
          }

          const notJoinedConvo = findUnsubscribedSids(allConversations, data);
          await joinAllConversation(client, notJoinedConvo);
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
