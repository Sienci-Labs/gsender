import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import _get from "lodash/get";
import _throttle from "lodash/throttle";

import { startFlash } from "Containers/Firmware/utils";
import Modal from "app/components/Modal";
import controller from "app/lib/controller";
import reduxStore from "app/store/redux";
import Button from "app/components/FunctionButton/FunctionButton";
import { Toaster, TOASTER_INFO } from "app/lib/toaster/ToasterLib";

import ProgressBar from "./ProgressBar";

import styles from "./index.styl";

const SLB_DFU_PORT = {
  port: "SLB_DFU",
  manufacturer: "",
  inuse: false,
};

const HalFlashModal = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [portList, setPortList] = useState([
    ..._get(reduxStore.getState(), "connection.ports", []),
    SLB_DFU_PORT,
  ]);
  const [port, setPort] = useState(controller.port);
  const [isFlashing, setIsFlashing] = useState(false);
  const fileInputRef = useRef();
  const [file, setFile] = useState(0);
  const [fileContent, setFileContent] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [curValue, setCurValue] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setNotifications([]);

    controller.addListener("flash:progress", (value, total) => {
      setCurValue(value);
      if (totalSize !== total) {
        setTotalSize(total);
      }
    });

    controller.addListener(
      "task:error",
      _throttle(
        (data) => {
          setNotifications((prev) => [data, ...prev]);
        },
        250,
        { trailing: false },
      ),
    );

    return () => {
      controller.removeListener("flash:progress");
      controller.removeListener("task:error");
    };
  }, []);

  useEffect(() => {
    // Listen to flash events
    controller.addListener("flash:message", (msg) => {
      let data = `${msg.type}: ${msg.content}`;
      setNotifications([data, ...notifications]);
    });

    controller.addListener("flash:end", () => {
      setNotifications([
        "Flash completed, please reconnect to your board.",
        ...notifications,
      ]);
      setIsFlashing(false);
      setIsCompleted(true);
    });

    return () => {
      controller.removeListener("flash:message");
      controller.removeListener("flash:end");
      controller.removeListener("task:error");
    };
  }, [notifications]);

  useEffect(() => {
    let fileReader,
      isCancel = false;
    if (file) {
      fileReader = new FileReader();
      fileReader.onload = (e) => {
        const { result } = e.target;
        if (result && !isCancel) {
          setFileContent(result);
        }
      };
      fileReader.readAsText(file);
    }
    return () => {
      isCancel = true;
      if (fileReader && fileReader.readyState === 1) {
        fileReader.abort();
      }
    };
  }, [file]);

  const refreshPorts = () => {
    controller.listPorts();

    const listOfPorts = _get(reduxStore.getState(), "connection.ports") || [];

    setPortList([...listOfPorts, SLB_DFU_PORT]);

    if (
      port !== "" &&
      portList.findIndex((p) => {
        return p.port === port;
      }) === -1
    ) {
      setPort("");
    }
  };

  const onChangefileInput = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No file found");
      return;
    }
    setFile(file);
  };

  const getNotificationsString = () => {
    return notifications.join("\n");
  };

  return (
    <Modal onClose={onClose} className={styles.modal}>
      <Modal.Header>
        <Modal.Title style={{ height: "2rem" }}>Flash grblHAL</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className={styles.wrapper}>
          <div className={styles.body}>
            <Select
              placeholder="Select a Device..."
              styles={{
                placeholder: (base) => ({
                  ...base,
                  fontSize: "1em",
                  color: "#D3D3D3",
                  fontWeight: 400,
                }),
              }}
              value={port ? { value: port, label: port } : ""}
              options={portList.map((element) => {
                return { value: element.port, label: element.port };
              })}
              onChange={(e) => {
                setPort(e.value);
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
                alignItems: "center",
              }}
            >
              <label htmlFor="firmware_image" style={{ margin: 0 }}>
                Choose a hex file
              </label>
              <input
                type="file"
                id="firmware_image"
                accept=".hex"
                ref={fileInputRef}
                onChange={onChangefileInput}
              />
            </div>

            <ProgressBar total={totalSize} sent={curValue} />
            <textarea
              value={getNotificationsString()}
              rows="6"
              cols="70"
              className={styles.notifications}
              readOnly={true}
            />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        {isCompleted && !isFlashing && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h1 className="footer-text">Flashing has completed.</h1>
            <div className="buttonContainer">
              <Button primary onClick={onClose}>
                Exit
              </Button>
            </div>
          </div>
        )}
        {!isCompleted && !isFlashing && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h1 className="footer-text">
              This process will disconnect your machine and may take a few
              minutes to complete.
            </h1>
            <h1 className="footer-textTwo">Continue?</h1>
            <div className="buttonContainer">
              <Button onClick={onClose}>No</Button>
              <Button
                onClick={() => {
                  if (!fileContent || !file) {
                    Toaster.pop({
                      msg: "Please select a hex file",
                      type: TOASTER_INFO,
                    });
                    return;
                  }
                  setIsFlashing(true);
                  startFlash(port, null, fileContent, true);
                }}
                primary
                onMouseEnter={refreshPorts}
                onMouseLeave={refreshPorts}
              >
                Yes
              </Button>
            </div>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default HalFlashModal;
