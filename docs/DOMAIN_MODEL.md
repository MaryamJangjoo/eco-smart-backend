# DOMAIN_MODEL.md

## Core Entities

### Building
- id (UUIDv4)
- name
- location

### Room
- id
- building_id
- name

### Device
- id
- room_id
- hardware_mac
- status

### SensorData
- id
- device_id
- timestamp
- payload

---

## Relationships

Building 1 → N Room  
Room 1 → N Device  
Device 1 → N SensorData

---

## Rules

- Device MUST belong to a Room
- Room MUST belong to a Building
- No orphan devices allowed