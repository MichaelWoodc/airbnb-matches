# Airbnb property photo matches

Public static website showing discovered Airbnb/Realtor photo matches and explicit user-verification labels. Sorted newest first, with property links, paired review photos, search and pagination. Published progress is a timestamped snapshot, not a live connection to the original workstation.

Generated from the local matching/review pipeline. Rejected and hidden pairs are omitted. Source photos are exported as metadata-free JPEG previews; raw listings, local paths, credentials, EXIF metadata and backend databases are not included. Human verification remains in the local review service; this public website is read-only.

A local systemd timer runs the exporter each minute. When findings or review states change, it commits and pushes the updated site; GitHub Pages rebuilds from `main`. The workstation and matching services must be running for updates.
