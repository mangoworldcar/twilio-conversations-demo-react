import React from "react";
import { Box } from "@twilio-paste/core";
import { MenuButton, Menu, MenuItem, useMenuState } from "@twilio-paste/menu";
import {
  MediaObject,
  MediaFigure,
  MediaBody,
} from "@twilio-paste/media-object";
import { MoreIcon } from "@twilio-paste/icons/esm/MoreIcon";
import { ArrowBackIcon } from "@twilio-paste/icons/esm/ArrowBackIcon";
import { Text } from "@twilio-paste/text";

import { NotificationsType } from "../../store/reducers/notificationsReducer";
import styles from "../../styles";
import { ReduxConversation } from "../../store/reducers/convoReducer";
import { AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";
import { useSelector } from "react-redux";
import { DeleteIcon } from "@twilio-paste/icons/cjs/DeleteIcon";

interface SettingsMenuProps {
  leaveConvo: () => void;
  deleteConvo: () => void;
  conversation: ReduxConversation;
  onParticipantListOpen: () => void;
  addNotifications: (messages: NotificationsType) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = (
  props: SettingsMenuProps
) => {
  const menu = useMenuState();
  const local = useSelector((state: AppState) => state.local);
  const leaveConvo = getTranslation(local, "leaveConvo");

  return (
    <Box style={styles.settingsWrapper}>
      <MenuButton {...menu} variant="link" size="reset">
        <MoreIcon decorative={false} title="Settings" />
      </MenuButton>
      <Menu {...menu} aria-label="Preferences">
        <MenuItem {...menu} onClick={props.leaveConvo}>
          <MediaObject verticalAlign="center">
            <MediaFigure spacing="space20">
              <ArrowBackIcon
                decorative={false}
                title="information"
                color="colorTextError"
              />
            </MediaFigure>
            <MediaBody>
              <Text
                as="a"
                color="colorTextError"
                _hover={{ color: "colorTextError", cursor: "pointer" }}
              >
                {leaveConvo}
              </Text>
            </MediaBody>
          </MediaObject>
        </MenuItem>
        <MenuItem {...menu} onClick={props.deleteConvo}>
          <MediaObject verticalAlign="center">
            <MediaFigure spacing="space20">
              <DeleteIcon
                decorative={false}
                title="information"
                color="colorTextError"
              />
            </MediaFigure>
            <MediaBody>
              <Text
                as="a"
                color="colorTextError"
                _hover={{ color: "colorTextError", cursor: "pointer" }}
              >
                {"Delete Conversation"}
              </Text>
            </MediaBody>
          </MediaObject>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SettingsMenu;
