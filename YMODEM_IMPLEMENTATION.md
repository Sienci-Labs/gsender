# YMODEM Implementation for GRBLHAL SD Card

This document describes the YMODEM file transfer implementation for GRBLHAL controllers in gSender.

## Overview

YMODEM is a file transfer protocol that provides reliable, error-checked file transfers over serial connections. This implementation allows users to transfer G-code files directly to the SD card of GRBLHAL controllers using the YMODEM protocol.

## Features

- **Reliable Transfer**: CRC16 error checking ensures data integrity
- **Progress Tracking**: Real-time progress updates during transfer
- **Error Handling**: Comprehensive error detection and reporting
- **File Management**: Support for file overwrite confirmation
- **Multiple File Types**: Support for .gcode, .nc, and .txt files
- **User-Friendly UI**: Modern React interface with progress bars and status updates

## Architecture

### Backend Components

1. **YModem.js** (`src/server/lib/YModem.js`)
   - Core YMODEM protocol implementation
   - Handles packet creation, CRC calculation, and acknowledgment
   - Manages file streams and transfer state

2. **GrblHalLineParserResultYModem.js** (`src/server/controllers/Grblhal/GrblHalLineParserResultYModem.js`)
   - Parses YMODEM-related responses from GRBLHAL
   - Handles various YMODEM event types (ready, progress, complete, error, etc.)

3. **GrblHalController.js** (`src/server/controllers/Grblhal/GrblHalController.js`)
   - Integrates YMODEM functionality with GRBLHAL controller
   - Provides command interface for YMODEM operations
   - Manages YMODEM event handling and state

### Frontend Components

1. **YModemTransfer.tsx** (`src/app/src/features/SDCard/components/YModemTransfer/index.tsx`)
   - React component for YMODEM transfer UI
   - File selection, progress tracking, and error display
   - Overwrite confirmation dialogs

2. **SDCard/index.tsx** (`src/app/src/features/SDCard/index.tsx`)
   - Updated to include YMODEM transfer functionality
   - Integrates with existing SD card management

## YMODEM Protocol Details

### Packet Structure

Each YMODEM packet consists of:
- **Header**: STX (0x02) for 1024-byte packets
- **Packet Number**: 0-255 with complement
- **Data**: 1024 bytes of file data or header information
- **CRC**: 16-bit CRC16 for error detection

### Transfer Flow

1. **Initiation**: Receiver sends 'C' to request CRC mode
2. **File Header**: Sender transmits file metadata (filename, size, timestamp)
3. **Data Transfer**: File data sent in 1024-byte packets
4. **Acknowledgment**: Receiver sends ACK (0x06) for successful packets
5. **Completion**: End packet (all zeros) signals transfer completion

### Error Handling

- **CRC Errors**: Automatic retransmission of corrupted packets
- **Timeouts**: Configurable timeout for acknowledgment waiting
- **Cancellation**: Support for transfer cancellation via CAN (0x18)
- **Storage Full**: Detection and reporting of SD card capacity issues

## Usage

### For Users

1. **Connect to GRBLHAL**: Ensure connection to a GRBLHAL controller
2. **Mount SD Card**: Use the "Mount SD Card" button
3. **Select File**: Choose a G-code file to transfer
4. **Start Transfer**: Click "Start Transfer" to begin YMODEM transfer
5. **Monitor Progress**: Watch real-time progress and status updates
6. **Handle Conflicts**: Confirm file overwrites if needed

### For Developers

#### Starting a Transfer

```javascript
// Start YMODEM transfer
controller.command('ymodem:start', filePath, remoteFilename);
```

#### Canceling a Transfer

```javascript
// Cancel current transfer
controller.command('ymodem:cancel');
```

#### Confirming Overwrite

```javascript
// Confirm file overwrite
controller.command('ymodem:overwrite');
```

#### Event Listening

```javascript
// Listen for YMODEM events
controller.addListener('ymodem:ready', () => {
    console.log('YMODEM transfer ready');
});

controller.addListener('ymodem:progress', (data) => {
    console.log(`Progress: ${data.progress}%`);
});

controller.addListener('ymodem:complete', (data) => {
    console.log(`Transfer complete: ${data.filename}`);
});

controller.addListener('ymodem:error', (data) => {
    console.error(`Transfer error: ${data.error}`);
});
```

## GRBLHAL Integration

### Required GRBLHAL Features

The GRBLHAL firmware must support:
- YMODEM protocol implementation
- SD card file system access
- Real-time status reporting for YMODEM events

### Expected GRBLHAL Responses

The implementation expects GRBLHAL to send responses in these formats:

```
YMODEM:READY
YMODEM:PROGRESS:1024/8192
YMODEM:COMPLETE
YMODEM:ERROR:Storage full
YMODEM:FILE:test.gcode|SIZE:8192
YMODEM:CANCELLED
YMODEM:TIMEOUT
YMODEM:CRC_ERROR
YMODEM:PACKET_ERROR:5
YMODEM:STORAGE_FULL
YMODEM:FILE_EXISTS:test.gcode
YMODEM:INVALID_FILENAME
YMODEM:UNSUPPORTED_TYPE
```

## Configuration

### Timeout Settings

```javascript
// In YModem.js
this.timeout = 10000; // 10 seconds timeout
this.retries = 10;    // Maximum retry attempts
```

### Packet Size

```javascript
// YMODEM uses 1024-byte packets
this.packetSize = 1024;
```

## Error Codes and Messages

| Error Type | Description | Resolution |
|------------|-------------|------------|
| `storage_full` | SD card has insufficient space | Free up space on SD card |
| `timeout` | Transfer timeout | Check connection and retry |
| `crc_error` | Data corruption detected | Automatic retry, check connection |
| `packet_error` | Packet transmission failed | Automatic retry |
| `invalid_filename` | Filename not allowed | Use valid filename |
| `unsupported_type` | File type not supported | Use .gcode, .nc, or .txt files |
| `file_exists` | File already exists | Confirm overwrite or cancel |

## Troubleshooting

### Common Issues

1. **Transfer Fails to Start**
   - Ensure GRBLHAL controller is connected
   - Check that SD card is mounted
   - Verify file format is supported

2. **Transfer Times Out**
   - Check serial connection stability
   - Increase timeout value if needed
   - Ensure GRBLHAL is not busy with other operations

3. **CRC Errors**
   - Check serial connection quality
   - Reduce baud rate if using high speeds
   - Ensure no interference on serial line

4. **Storage Full**
   - Check SD card capacity
   - Remove unnecessary files from SD card
   - Use smaller files if needed

### Debug Information

Enable debug logging by setting the log level:

```javascript
// In logger configuration
const log = logger('YModem');
log.setLevel('debug');
```

## Future Enhancements

1. **Batch Transfers**: Support for transferring multiple files in sequence
2. **Resume Capability**: Resume interrupted transfers
3. **Compression**: Optional file compression for faster transfers
4. **Encryption**: Optional file encryption for sensitive G-code files
5. **Transfer Queue**: Queue management for multiple pending transfers

## Contributing

When contributing to the YMODEM implementation:

1. Follow the existing code style and patterns
2. Add comprehensive error handling
3. Include unit tests for new functionality
4. Update documentation for any changes
5. Test with actual GRBLHAL hardware

## License

This implementation is part of gSender and follows the same licensing terms as the main project. 