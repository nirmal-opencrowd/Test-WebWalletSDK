import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import CopyIcon from "@material-ui/icons/FileCopy";
import PassphraseModal from "../PassphraseModal";
// import useDisclosure from "hooks/useDisclosure";

const Copy = ({ text,
  variant = "icon",
  toolTipTitle = "Copy to clipboard",
  iconColor = "primary",
  children,
  copyMessage = "Copied!",
  iconSize ,
  openPassphraseModal,
  setOpenPassphraseModal,
  passphraseMatched,
  setPassphraseMatched,
  requestCount,
  setRequestCount,
  clickType,
  setClickType,
  currentElem,
  messagePosition
}) => {
  // const { isOpen, onOpen, onClose } = useDisclosure(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = text;
      // make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      new Promise((res, rej) => {
          document.execCommand('copy') ? res() : rej();
          textArea.remove();
      });
    }
    if (setClickType) {
      setClickType("");
    }
    setIsOpen(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 1500);
  }

  const handleClick = () => {
    if (setOpenPassphraseModal) {
      if (!passphraseMatched) {
        setOpenPassphraseModal(true);
      } else {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  React.useEffect(() => {
    if(passphraseMatched && clickType == currentElem) {
      copyToClipboard();
    }
  }, [passphraseMatched]);

  return (
    <React.Fragment>
      <Tooltip title={<Typography>{toolTipTitle}</Typography>}>
        <span
          aria-label="copy"
          onClick={handleClick}
          style={{ cursor: "pointer" }}
        >
          {children ? children
          : (variant === "icon") ? <img src="./copyIcon.png" style={{fontSize: `${iconSize ? iconSize : 'inherit'}`}} color={iconColor} /> : "Copy"
          }
        </span>
      </Tooltip>
      <Snackbar
        anchorOrigin={messagePosition == "top" ?
        {
          vertical: "top",
          horizontal: "left",
        }
        : {
          vertical: "bottom",
          horizontal: "left",
        }}
        className="zIndex100"
        open={isOpen}
        autoHideDuration={500}
        onClose={() => setIsOpen(true)}
        message={<div style={{zIndex: "100"}}>{copyMessage}</div>}
      />
    </React.Fragment>
  );
};

export default Copy;
