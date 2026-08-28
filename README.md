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
        entity: switch.livingroom_hp_g4_z4_power_switch_switch
        power_entity: sensor.livingroom_hp_g4_z4_power_switch_power
        id: switch.livingroom_hp_g4_z4_power_switch_switch
        label: Desk Power Switch
        power: sensor.livingroom_hp_g4_z4_power_switch_power
      - name: HP-Z4 & Thinksmart
        icon: mdi:desktop-classic
        entity: switch.livingroom_hp_z4_thinksmart
        power_entity: sensor.livingroom_hp_z4_thinksmart_power
        id: switch.livingroom_hp_z4_thinksmart
        label: Desk HP-Z4 & Thinksmart
        power: ''
      - name: Desk Fan
        icon: mdi:fan
        entity: switch.livingroom_floor_heating_light_socket_switch
        power_entity: sensor.livingroom_floor_heating_light_socket_power
        id: switch.livingroom_floor_heating_light_socket_switch
        label: Desk Fan
        power: sensor.livingroom_floor_heating_light_socket_power
      - name: Dinner Table
        icon: mdi:table-furniture
        entity: switch.worktable_power
        power_entity: sensor.worktable_power_power
        id: switch.worktable_power
        label: Livingroom Dining Power
        power: sensor.worktable_power_power
  - label: Bedroom
    icon: mdi:bed
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Bedside Table Main
        icon: mdi:bed-king
        entity: switch.spare_switch_3
        power_entity: sensor.spare_power
        id: switch.spare_switch_3
        label: Table Main Power Switch
        power: sensor.spare_power
      - name: Heating Blanket
        icon: mdi:heat-wave
        entity: switch.bedroom_blanket_power
        power_entity: sensor.bedroom_blanket_power_power
        id: switch.bedroom_blanket_power
        label: Bedroom Blanket Power
        power: sensor.bedroom_blanket_power_power
  - label: Kitchen
    icon: mdi:silverware-clean
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Microwave
        icon: mdi:microwave
        entity: switch.kitchen_microwave_power_switch_switch
        power_entity: sensor.kitchen_microwave_power_switch_power
        id: switch.kitchen_microwave_power_switch_switch
        label: 'Microwave '
        power: sensor.kitchen_microwave_power_switch_power
      - name: Espresso & Grinder
        icon: mdi:coffee-maker
        entity: switch.kitchen_coffee_grinder_power_switch_switch
        power_entity: sensor.kitchen_coffee_grinder_power_switch_power
        id: switch.kitchen_coffee_grinder_power_switch_switch
        label: Kitchen Coffee & Grinder Power Switch
        power: sensor.kitchen_coffee_grinder_power_switch_power
      - name: Blender
        icon: mdi:blender
        entity: switch.kitchen_breadmachine_switch
        power_entity: sensor.kitchen_breadmachine_power
        id: switch.kitchen_breadmachine_switch
        label: Blender
        power: sensor.kitchen_breadmachine_power
      - name: Washing Machine
        icon: mdi:washing-machine
        entity: switch.lumi_lumi_plug_maeu01_switch
        power_entity: sensor.kitchen_washing_machine_power
        id: switch.lumi_lumi_plug_maeu01_switch
        label: Washing machine
        power: sensor.kitchen_washing_machine_power
      - name: Ninja Oven
        icon: mdi:toaster-oven
        entity: switch.kitchen_ninja_oven_switch
        power_entity: sensor.kitchen_ninja_oven_power
        id: switch.kitchen_ninja_oven_switch
        label: 'Ninja Oven '
        power: sensor.kitchen_ninja_oven_power
      - name: Multicooker & Bread
        icon: mdi:pot-steam
        entity: switch.kitchen_multicooker_switch
        power_entity: sensor.kitchen_multicooker_power
        id: switch.kitchen_multicooker_switch
        label: Multicooker & Bread
        power: sensor.kitchen_multicooker_power
      - name: Freezer
        icon: mdi:snowflake-thermometer
        entity: switch.stockroom_freezer_power_switch_switch
        power_entity: sensor.stockroom_freezer_power_switch_power
        id: switch.stockroom_freezer_power_switch_switch
        label: 'Freezer '
        power: sensor.stockroom_freezer_power_switch_power
      - name: Fridge
        icon: mdi:fridge-industrial-outline
        entity: switch.lumi_lumi_plug_maeu01_switch_2
        power_entity: sensor.lumi_lumi_plug_maeu01_active_power_2
        id: switch.lumi_lumi_plug_maeu01_switch_2
        label: Kitchen Fridge Power Switch
        power: sensor.lumi_lumi_plug_maeu01_active_power_2
  - label: Stockroom
    icon: mdi:warehouse
    group: ''
    circuit_limit: 3680
    sockets:
      - name: Video Doorbell
        icon: mdi:cctv
        entity: switch.stockroom_camera_switch
        power_entity: sensor.stockroom_camera_power
        id: switch.stockroom_camera_switch
        label: 'Doorbell Camera '
        power: sensor.stockroom_camera_power
      - name: Soldering Station
        icon: mdi:soldering-iron
        entity: switch.livingroom_desk_charger_2
        power_entity: sensor.livingroom_desk_charger_power_2
        id: switch.kitchen_dasboard_tablet
        label: Tablet
        power: sensor.kitchen_dasboard_tablet_power
      - name: Paper Shredder
        icon: mdi:paper-roll
        entity: switch.livingroom_wall_led_strip_power_switch
        power_entity: sensor.livingroom_wall_led_strip_power_power
        id: switch.livingroom_desk_charger_2
        label: Soldering Station
        power: sensor.livingroom_desk_charger_power_2
      - name: Light
        icon: mdi:light-flood-down
        entity: >-
          switch.livingroom_stockroom_light_power_livingroom_hp_g4_thinksmart_power_switch
        power: sensor.livingroom_wall_led_strip_power_power
        id: switch.livingroom_wall_led_strip_power_switch
        label: 'Papercutter '
      - label: Stockroom
        id: >-
          switch.livingroom_stockroom_light_power_livingroom_hp_g4_thinksmart_power_switch
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
