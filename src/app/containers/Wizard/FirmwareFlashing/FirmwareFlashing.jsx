/* eslint-disable react/prop-types */
/* eslint-disable no-unneeded-ternary */
import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';
import AvrgirlArduino from './avrgirl-arduino';
// import ArduinoUno from './images/ArduinoUno.svg';
// import gear from './images/gear4.svg';

const FirmwareFlashing = ({ active }) => {
    let getInitialState = () => {
        return {
            fileName: '',
            upLoading: false
        };
    };

    let state = getInitialState();

    const boardChoices = [
        'uno',
    ];

    const fileInput = 'null';
    // const [uploading, updateUploading] = useState(false);

    const handleSubmit = e => {
        e.preventDefault();
        // updateUploading(true);
        // setState({ upLoading: true });

        const reader = new FileReader();
        reader.readAsArrayBuffer(fileInput.current.files[0]);

        reader.onload = event => {
            const filecontents = event.target.result;

            const avrgirl = new AvrgirlArduino({
                board: boardChoices[0],
                debug: true
            });

            avrgirl.flash(filecontents, error => {
                if (error) {
                    console.error(error);
                } else {
                    console.info('flash successful');
                }
                // updateUploading(false);
            });
        };
    };

    const BoardOptions = boardChoices.map((board, i) => <option value={board} key={i}>{board}</option>);

    return (
        <div className={classNames(
            styles.hidden,
            styles.header,
            { [styles.visible]: active }
        )}
        >
            <h3>
                Firmware Flashing
            </h3>
            <div className="main">
                <div className="wrapper">
                    <div className="bot">
                        <p>Choose a program to upload to your arduino board</p>

                        <form id="uploadForm" onSubmit={handleSubmit}>
                            <label>
                                Board:
                                <select
                                    id="boardType"
                                    value={boardChoices[0]}
                                // onChange={event => updateBoard(event.target.value)}
                                >
                                    {BoardOptions}
                                </select>
                            </label>

                            <label>
                                Program:
                                <div className="fileButtonWrapper">
                                    <button
                                        id="fileButton"
                                        type="button"
                                        aria-controls="fileInput"
                                        onClick={() => fileInput.current.click()}
                                    >
                                        Choose file
                                    </button>
                                    <input
                                        id="fileInput"
                                        tabIndex="-1"
                                        type="file"
                                    // ref={fileInput}
                                    // onChange={() => updateFileName(fileInput.current.files[0].name)
                                    // }
                                    />
                                    <span id="fileName">
                                        {state.fileName ? state.fileName : 'no file chosen'}
                                    </span>
                                </div>
                            </label>

                            <button type="submit" id="uploadBtn">
                                Upload!
                            </button>
                        </form>
                    </div>

                    <div className="board">
                        {/* <img src={ArduinoUno} alt="arduino board" /> */}
                    </div>
                    <div id="pipe" />
                    <div id="progress" />
                    <div id="gear">
                        {/* <img
                            src={gear}
                            alt="gear icon"
                            // className={uploading ? 'spinning' : null}
                        /> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirmwareFlashing;
