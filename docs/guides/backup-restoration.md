# Backup and Restoration Guide

## Overview

The Real Estate Development Tracker provides comprehensive backup and restoration capabilities to protect your project data. This guide covers downloading backups, understanding backup formats, and restoring data when needed.

## Table of Contents

1. [Creating Backups](#creating-backups)
2. [Backup Formats](#backup-formats)
3. [Security Notifications](#security-notifications)
4. [Restoring from Backups](#restoring-from-backups)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Creating Backups

### Accessing Backup Options

1. Navigate to your project page
2. Click on the **Settings** or **Actions** menu
3. Select **Download Backup**

### Available Backup Formats

The system provides two backup formats:

#### JSON Backup

- **File Format**: `.json`
- **Size**: Smaller file size
- **Use Case**: Quick backups, programmatic processing
- **Content**: Complete project data in JSON format

#### ZIP Archive Backup

- **File Format**: `.zip`
- **Size**: Larger, includes all documents
- **Use Case**: Complete project archive with all attachments
- **Content**: JSON data + all project documents

### Backup Contents

Each backup includes:

- Project information (name, description, status)
- Property address details
- Cost records and financial data
- Contact information
- Event history
- Document metadata
- Timestamps and audit trail

**ZIP backups additionally include:**

- All uploaded documents (PDFs, images, etc.)
- Original file names and directory structure

---

## Backup Formats

### JSON Backup Structure

```json
{
  "project": {
    "id": "...",
    "name": "Downtown Development",
    "description": "...",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    ...
  },
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    ...
  },
  "costs": [...],
  "contacts": [...],
  "events": [...],
  "documents": [...]
}
```

### ZIP Archive Structure

```
project-backup-TIMESTAMP.zip
├── project-data.json          # Complete project data
└── documents/                 # Document files
    ├── permits/
    │   └── building-permit.pdf
    ├── contracts/
    │   └── contractor-agreement.pdf
    └── photos/
        └── site-photo-1.jpg
```

---

## Security Notifications

### Automatic Notifications

When you download a backup, you will receive:

1. **Email Notification**
   - Sent to your registered email address
   - Includes timestamp and device information
   - Shows IP address (partially masked for privacy)

2. **Activity Log Entry**
   - Recorded in your Security Activity Log
   - Accessible in Settings > Security
   - Includes full details of the download

### Reviewing Security Events

To review your backup downloads:

1. Go to **Settings** > **Security**
2. Scroll to **Security Activity Log**
3. Look for "Project Backup Downloaded" events

---

## Restoring from Backups

### Important Notes

⚠️ **Before Restoring:**

- Backups are currently **export-only**
- There is no automated restore functionality in the UI
- Restoration requires manual data entry or database-level import
- Contact your system administrator for bulk restorations

### Manual Data Entry

For small-scale restorations:

1. **Review the backup JSON file**
   - Extract the `.json` file from ZIP backup
   - Open in a text editor or JSON viewer

2. **Identify data to restore**
   - Locate the specific records you need
   - Note the field values

3. **Manually re-enter data**
   - Create new records in the application
   - Copy field values from the backup

### Database-Level Restoration

For complete project restorations (requires database access):

1. **Contact System Administrator**
   - Provide the backup file
   - Specify which project to restore
   - Confirm restoration timestamp

2. **Administrator Process**
   - Parse the JSON backup
   - Insert records using database tools
   - Preserve foreign key relationships
   - Upload documents to storage

---

## Best Practices

### Regular Backups

- **Weekly backups** for active projects
- **Monthly backups** for completed projects
- **Before major changes** (bulk imports, deletions)

### Storage Recommendations

- Store backups in **multiple locations**:
  - Local computer
  - Cloud storage (Google Drive, Dropbox)
  - External hard drive
- Use **ZIP format** for complete archives
- Use **JSON format** for version control

### Backup Naming Convention

We recommend naming your backups consistently:

```
[project-name]-backup-[YYYY-MM-DD]-[type].[ext]
```

Examples:

- `downtown-development-backup-2024-10-27-json.json`
- `downtown-development-backup-2024-10-27-zip.zip`

### Security Considerations

- **Protect your backups** with strong passwords (if using encrypted storage)
- **Limit access** to authorized personnel only
- **Review activity logs** regularly for unauthorized downloads
- **Verify backup integrity** by testing restoration periodically

---

## Troubleshooting

### Backup Download Issues

**Problem:** Download fails or times out

**Solutions:**

- Try the JSON format (smaller file size)
- Check your internet connection
- Contact support if the issue persists

**Problem:** ZIP backup is missing documents

**Solutions:**

- Verify that documents were properly uploaded
- Check document upload status in the UI
- Some documents may have failed to upload originally

### Backup File Issues

**Problem:** Can't open the JSON file

**Solutions:**

- Use a text editor (VS Code, Notepad++)
- Use a JSON viewer tool online
- Ensure the download completed successfully

**Problem:** ZIP file is corrupted

**Solutions:**

- Re-download the backup
- Try a different extraction tool (7-Zip, WinRAR)
- Contact support if corruption persists

### Restoration Issues

**Problem:** Need to restore deleted project

**Solutions:**

- Locate the most recent backup
- Contact your system administrator
- Provide the backup file for database-level restoration

**Problem:** Missing data in backup

**Solutions:**

- Check if data existed before backup was created
- Try an earlier backup if available
- Contact support to investigate

---

## Rate Limits

To prevent abuse, backup downloads are rate-limited:

- **5 backups** per project per hour
- Applies to both JSON and ZIP formats
- Resets after 1 hour

If you exceed this limit, wait 1 hour before downloading again.

---

## Support

For additional assistance:

- **Email:** support@example.com
- **Documentation:** See project README
- **GitHub Issues:** Report bugs on the project repository

---

## Version History

- **1.0** (October 2024) - Initial backup and export functionality
- **1.1** (November 2024) - Added ZIP format with documents, security logging

---

**Last Updated:** November 1, 2024
