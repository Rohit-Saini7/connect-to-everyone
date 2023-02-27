import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import './popup.css';

const Popup = () => {
  /* All variables as states */
  const [tabs, setTabs] = useState<object>({});
  const [error, setError] = useState('');
  const [action, setAction] = useState('START');
  const [totalConnects, setTotalConnects] = useState(0);
  const [connectsLeft, setConnectsLeft] = useState(0);
  const [value, setValue] = useState(0);
  const [endValue, setEndValue] = useState(0);

  let interval: NodeJS.Timer;

  /* Function for response from ContentScript. */
  const resFromExt = (res: { type: string; response: any }) => {
    const { message } = chrome.runtime.lastError;
    !!message &&
      message ===
        'Could not establish connection. Receiving end does not exist.' &&
      setError(message);

    !!res?.type
      ? res.type === 'TOTALBUTTONS'
        ? setTotalConnects(res.response)
        : setAction(res.response)
      : console.log('it doesnt work like that');
  };

  /* Gets active tab ID and send message to contentScript to get buttons */
  useEffect(() => {
    console.log(chrome.tabs);

    chrome.tabs &&
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          console.log(tabs);

          setTabs(tabs);
          chrome.tabs.sendMessage(tabs[0].id, 'GETBUTTONS', resFromExt);
        }
      );
  }, []);

  /* For animation of Ring */
  useEffect(() => {
    value < endValue
      ? (interval = setInterval(() => setValue(value + 1), 10))
      : setValue(endValue);
    return () => clearInterval(interval);
  }, [value, endValue]);

  /* Handles click on Start or Stop Button */
  function handleClick(action: string) {
    setAction((p) => (p === 'START' ? 'STOP' : 'START'));
    chrome.tabs.sendMessage(tabs[0].id || 0, action, resFromExt);
  }

  /* Checks for MESSAGES from ContentScript */
  chrome.runtime.onMessage.addListener(({ msgType, msg }) => {
    switch (msgType) {
      case 'FINISHED':
        setAction(msg);
        break;

      case 'DONE':
        setConnectsLeft(msg);
        setEndValue((msg / totalConnects) * 100);
        break;

      default:
        setAction('error in popup: msgType:  ' + msgType);
        break;
    }
  });

  return (
    <React.Fragment>
      {!!error && (
        <Error
          title='Click to dismiss...'
          onClick={() => {
            console.log(error);
            setError('');
          }}
        >
          Extension only works on "https://*.linkedin.com/*"
        </Error>
      )}
      <Nav>
        <Heading>Start Connecting...</Heading>
      </Nav>
      <Main>
        <SubHeading>Invitation Sent</SubHeading>
        <RingWrapper className='ring-wrapper'>
          <Svg>
            <Circle
              r={42}
              cx={60}
              cy={60}
              stroke='rgb(0, 255, 255, .7)'
              strokeDasharray={`${value * 2.6}, ${(100 - value) * 2.6}`}
            />
            <Circle r={42} cx={60} cy={60} stroke='rgba(255 ,255 ,255 ,0.1)' />
          </Svg>
          <Label>
            {connectsLeft}/{totalConnects}
          </Label>
        </RingWrapper>
        <ActionButton onClick={() => handleClick(action)}>
          {action}
        </ActionButton>
      </Main>
    </React.Fragment>
  );
};

export default Popup;

/* Custom Styped Components */

const Error = styled.div`
  position: fixed;
  height: 100%;
  width: 100%;
  text-align: center;
  justify-content: center;
  display: flex;
  align-items: center;
  color: rgba(255, 89, 89);
  font-size: 1.2rem;
  z-index: 10;
  backdrop-filter: blur(7px);
  font-weight: 700;
`;

const Nav = styled.header`
  display: flex;
  justify-content: center;
  background-color: #2d3646;
  padding: 5px;
`;

const Heading = styled.h1`
  font-size: 1.3rem;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const SubHeading = styled.h2`
  font-size: 1.2rem;
  margin-top: 20px;
`;

const RingWrapper = styled.div`
  height: 120px;
  width: 120px;
  position: relative;
  text-align: center;
  transition: 1s;
`;

const Svg = styled.svg`
  width: 120px;
  height: 120px;
  transition: 1s;
  rotate: -90deg;
`;

const Circle = styled.circle`
  fill: none;
  stroke-width: 10px;
  stroke-linecap: round;
`;

const Label = styled.label`
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  right: 24px;
  left: 24px;
`;

const ActionButton = styled.button`
  font-size: 1.1rem;
  font-weight: 500;
  border: 0;
  border-radius: 10px;
  background-color: #7bc495;
  color: #000;
  padding: 10px 20px;
  transition: 0.25s;
  margin-bottom: 20px;

  &:hover,
  &:focus {
    translate: 0 -2px;
  }
  &:active {
    translate: 0 2px;
  }
`;
