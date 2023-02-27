/* Global Variables */
const connectButtons = [];
let connectDone = 0;
let interval: NodeJS.Timer;


/* Function to SEND message to Extension */
const sendMsgToExt = (msgType: string, msg: number | string) => {
  chrome.runtime.sendMessage({ msgType, msg });
}

/* Function to RECIEVE message from Extension */
const msgFromExt = (action: string, sendRes: (type: string, response: any) => void) => {
  switch (action) {
    case "GETBUTTONS":
    case "STOP":
      getConnectButtons(sendRes);
      break;

    case "START":
      startConnecting();
      break;

    default:
      sendRes("ERROR", action);
      break;
  }
}

/* Checks for MESSAGES from Extension */
chrome.runtime.onMessage.addListener(
  (msg, sender, sendRes) => msgFromExt(msg, sendRes)
);


/* Custom Function for specific TASKS. */

/* Get all connect button and put them in an Array for later use. */
const getConnectButtons = (sendRes) => {
  /* Resets the Global Variables */
  if (!!connectButtons.length) {
    clearInterval(interval);
    connectButtons.length = 0;
    connectDone = 0;
  }
  /* Filter "Connect" Buttons only. */
  document.querySelectorAll('button').forEach(button => {
    if (button?.attributes["aria-label"]?.value.slice(0, 6) === "Invite") {
      connectButtons.push(button);
    }
  })
  sendRes({ type: "TOTALBUTTONS", response: connectButtons.length });
}

/* If POPUP opens when "connect button" is clicked. */
const clickSendButton = () => {
  /* Timeout give room for POPUP to appear. */
  setTimeout(() => {
    /* Filter "Send || Others" Button only. */
    document.querySelectorAll("button").forEach((btn) => {
      let labelValue = btn?.attributes["aria-label"]?.value;
      if (labelValue === "Send now" || labelValue === "Other" || labelValue === "Connect") {
        btn.click();
      }
    });
  }, 2000);
}

/* Function to start clicking CONNECT button. */
const startConnecting = () => {
  /* Pseudorandomly calculates the delay. (Range 5-10 Sec)  */
  let delay = Math.floor((Math.random() * 5000) + 5000);

  /* To click on all buttons after some delay. */
  interval = setInterval(() => {
    if (connectDone < connectButtons.length) {
      connectButtons[connectDone].focus();
      connectButtons[connectDone].click();
      clickSendButton();

      connectDone += 1;
      delay = Math.floor((Math.random() * 5000) + 5000);
      sendMsgToExt("DONE", connectDone);
    } else {
      sendMsgToExt("FINISHED", "START");
      clearInterval(interval);
    }
  }, delay)
}