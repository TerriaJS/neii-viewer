import React, { useState, useEffect } from "react";
import Icon from "terriajs/lib/ReactViews/Icon.jsx";
import classNames from "classnames";
import Styles from "./survey-popup.scss";

const DO_NOT_SHOW_SURVEY = "doNotShowSurvey";
const SURVEY_LINK = "https://neii.gov.au/neii-customer-survey";

/**
 * Shows survey popup if the user hasn't dismissed it forever.
 */
const SurveyPopup = ({ terria }) => {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Show survey after a time out so that the slide-in animation can play
    setTimeout(() => {
      const showSurvey = terria.getLocalProperty(DO_NOT_SHOW_SURVEY) !== true;
      setShow(showSurvey);
    }, 700);
  }, []);

  useEffect(() => {
    // Give time for the slide-out animation before hiding the survey
    setTimeout(() => {
      if (closing) {
        setClosing(false);
        setShow(false);
      }
    }, 1000);
  }, [closing]);

  const handleClose = (persist) => {
    setClosing(true);
    if (persist) terria.setLocalProperty(DO_NOT_SHOW_SURVEY, true);
  };

  return (
    <>
      {(show || closing) && (
        <div
          className={classNames({
            [Styles.popupModalWrapper]: true,
            [Styles.popupModalWrapperClosing]: closing,
          })}
          onClick={() => handleClose(false)}
        >
          <article
            className={Styles.popupModal}
            style={{
              backgroundImage: `url(${require("../../wwwroot/images/survey-modal-bg.jpg")})`,
            }}
          >
            <Icon
              className={Styles.closeButton}
              glyph={Icon.GLYPHS.close}
              onClick={() => handleClose(false)}
            />
            <div className={Styles.popupModalContent}>
              <div className={Styles.message}>
                  The NEII team would like to know about your NEII website
                  usage.
              </div>
              <div className={Styles.message}>
                  <b>Please complete our short survey.</b>
              </div>
              <a
                target="_blank"
                className={Styles.surveyLink}
                href={SURVEY_LINK}
                onClick={() => handleClose(true)}
              >
                <Icon glyph={Icon.GLYPHS.externalLink} />
                Open NEII survey
              </a>
              <button
                className={Styles.dontShowAgain}
                onClick={() => handleClose(true)}
              >
                Close message and don't show again
              </button>
            </div>
          </article>
        </div>
      )}
    </>
  );
};

export default SurveyPopup;
