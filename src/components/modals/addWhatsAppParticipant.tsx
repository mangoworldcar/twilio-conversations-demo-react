import { ModalBody, Box } from "@twilio-paste/core";
import { RefObject, useEffect } from "react";
import ModalInputField from "./ModalInputField";
import AddParticipantFooter from "./addParticipantFooter";
import { ActionName } from "../../types";
import ConvoModal from "./ConvoModal";
import { AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";
import { useSelector } from "react-redux";

interface AddWhatsAppParticipantModalProps {
  name: string;
  isModalOpen: boolean;
  title: string;
  proxyName: string;
  setName: (name: string) => void;
  setProxyName: (name: string) => void;
  error: string;
  errorProxy: string;
  nameInputRef: RefObject<HTMLInputElement>;
  onBack: () => void;
  action: () => void;
  handleClose: () => void;
}

const AddWhatsAppParticipantModal: React.FC<AddWhatsAppParticipantModalProps> =
  (props: AddWhatsAppParticipantModalProps) => {
    const local = useSelector((state: AppState) => state.local);
    const addWhatsAppParticipant = getTranslation(
      local,
      "addWhatsAppParticipant"
    );
    const whatsAppNum = getTranslation(local, "whatsAppNum");
    const whatsAppHelpTxt = getTranslation(local, "whatsAppHelpTxt");

    useEffect(() => {
      props.setProxyName("821084656951");
    }, []);

    return (
      <>
        <ConvoModal
          handleClose={() => props.handleClose()}
          isModalOpen={props.isModalOpen}
          title={props.title}
          modalBody={
            <ModalBody>
              <h3>{addWhatsAppParticipant}</h3>
              <Box
                as="form"
                onKeyPress={async (e) => {
                  if (e.key === "Enter") {
                    if (props.action) {
                      e.preventDefault();
                      props.action();
                    }
                  }
                }}
              >
                <ModalInputField
                  isFocused={true}
                  label={whatsAppNum}
                  input={props.name}
                  placeholder="82XXXXXXXXXX"
                  onChange={props.setName}
                  error={props.error}
                  help_text={whatsAppHelpTxt}
                  prefixType="WhatsApp"
                />
              </Box>
            </ModalBody>
          }
          modalFooter={
            <AddParticipantFooter
              isSaveDisabled={
                !props.name.trim() || !props.proxyName.trim() || !!props.error
              }
              actionName={ActionName.Save}
              onBack={() => {
                props.onBack();
              }}
              action={props.action}
            />
          }
        />
      </>
    );
  };

export default AddWhatsAppParticipantModal;
