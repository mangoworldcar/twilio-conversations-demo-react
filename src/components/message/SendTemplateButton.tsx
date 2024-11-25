import { Button } from "@twilio-paste/button";
import { Box } from "@twilio-paste/core";
import styles from "../../styles";

interface SendTemplateButtonProps {
  onClick: () => void;
}

const SendTemplateButton: React.FC<SendTemplateButtonProps> = (
  props: SendTemplateButtonProps
) => {
  return (
    <Box style={styles.buttonWrapper}>
      <Button
        variant="primary"
        onClick={() => {
          props.onClick();
        }}
      >
        Send Template
      </Button>
    </Box>
  );
};

export default SendTemplateButton;
