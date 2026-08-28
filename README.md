# universal socket card

> Stop juggling individual sockets cards. Control every room's sockets, from one beautiful collapsible card.

A custom Lovelace card for Home Assistant that organizes all your sockets by room into a single, elegant interface. 


---

## Features

- **Room tiles with live gradients** : each tile reflects the actual color(s) of your lights in real time
- **Auto-detection** : brightness, color temperature, color, and effects are detected automatically from each light's HA attributes. No manual configuration needed
- **Collapsible room panels** : tap a room to expand its controls, tap again to collapse
- **Individual light controls** : per-light brightness, temperature, color sliders and effects, expandable inline
- **Effects support** : room-level and per-light effects with scrollable overflow for large effect lists
- **Visual config editor** : full UI editor with icon picker, entity dropdowns, and auto-filled labels. No YAML required
- **Works with any light brand** : Govee, Philips Hue, IKEA, Sengled, Zigbee, Z-Wave, and more
- **Switch support** : kitchen or other switch-controlled lights work as simple on/off tiles

---

## Installation

### Manual

1. Download `universal-socket-card.js` 
2. Copy file to your `/config/www/` directory
3. Go to **Settings → Dashboards → Resources** and add:
   - `/local/universal-socket-card.js` (type: JavaScript Module)
   
4. Hard refresh your browser

---

## Usage

### Visual Editor (Recommended)

1. Edit your dashboard
2. Click **Add Card**
3. Search for **AIO Light Controller**
4. Use the visual editor to add rooms, pick entities, and configure lights. No YAML needed

### YAML Configuration

type: custom:universal-socket-card
title: Socket Control
power: sensor.electricity_meter_power_consumption
energy:
  - sensor.daily_energy_offpeak
  - sensor.daily_energy_peak
columns: 4
glass_mode: false
rooms:
  - label: Livingroom
    icon: mdi:sofa
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Desk Main Power
        icon: mdi:desk
        entity: switch.
        power_entity: sensor.l
        id: switch.l
        label: Desk Power Switch
        power: sensor.
      - name: HP-Z4 & Thinksmart
        icon: mdi:desktop-classic
        entity: switch.
        power_entity: sensor.
        id: switch.l
        label: Desk HP-Z4 & Thinksmart
        power: ''
      - name: Desk Fan
        icon: mdi:fan
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Desk Fan
        power: sensor.
      - name: Dinner Table
        icon: mdi:table-furniture
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Livingroom Dining Power
        power: sensor.
  - label: Bedroom
    icon: mdi:bed
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Bedside Table Main
        icon: mdi:bed-king
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Table Main Power Switch
        power: sensor.
      - name: Heating Blanket
        icon: mdi:heat-wave
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Bedroom Blanket Power
        power: sensor.
  - label: Kitchen
    icon: mdi:silverware-clean
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Microwave
        icon: mdi:microwave
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: 'Microwave '
        power: sensor.
      - name: Espresso & Grinder
        icon: mdi:coffee-maker
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Kitchen Coffee & Grinder 
        power: sensor.
      - name: Blender
        icon: mdi:blender
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Blender
        power: sensor.
      - name: Washing Machine
        icon: mdi:washing-machine
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Washing machine
        power: sensor.
      - name: Ninja Oven
        icon: mdi:toaster-oven
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: 'Ninja Oven '
        power: sensor.
      - name: Multicooker & Bread
        icon: mdi:pot-steam
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Multicooker & Bread
        power: sensor.
      - name: Freezer
        icon: mdi:snowflake-thermometer
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: 'Freezer '
        power: sensor.
      - name: Fridge
        icon: mdi:fridge-industrial-outline
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Kitchen Fridge Power Switch
        power: sensor.
  - label: Stockroom
    icon: mdi:warehouse
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Video Doorbell
        icon: mdi:cctv
        entity: switch.
        power_entity: sensor.
        id: switch.stockroom_camera_switch
        label: 'Doorbell Camera '
        power: sensor.
      - name: Soldering Station
        icon: mdi:soldering-iron
        entity: switch.
        power_entity: sensor.
        id: switch.kitchen_dasboard_tablet
        label: Tablet
        power: sensor.
      - name: Paper Shredder
        icon: mdi:paper-roll
        entity: switch.
        power_entity: sensor.
        id: switch.
        label: Soldering Station
        power: sensor.
      - name: Light
        icon: mdi:light-flood-down
        entity: >-
          switch.
        power: sensor.
        id: switch.
        label: 'Papercutter '
      - label: Stockroom
        id: >-
          switch.
        power: ''
        energy: ''
        rated: 1000
card_mod:
  style: |
    .wrap {
      background: transparent !important;
      padding: 0 !important;
    }
    .title,
    .hint {
      display: none !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .grid {
      gap: 6px !important;
    }
    .tile {
      background: rgba(0, 0, 0, 0.35) !important;
      border-radius: 14px !important;
      border: none !important;
      box-shadow: none !important;
      min-height: 100px !important;
      padding: 8px 4px !important;
      gap: 3px !important;
      backdrop-filter: none !important;
    }
    .tile ha-icon {
      --mdc-icon-size: 30px !important;
      color: rgba(255,255,255,0.9) !important;
    }
    .tile-name {
      font-size: 11px !important;
      font-weight: 500 !important;
      color: rgba(255,255,255,0.85) !important;
      margin: 0 !important;
    }
    .tile-watts {
      color: rgba(255,255,255,0.75) !important;
      opacity: 1 !important;
    }
    .tile.active {
      border: 1px solid var(--primary-color, #ff9f09) !important;
      box-shadow: 0 0 6px rgba(255, 159, 9, 0.25) !important;
    }
