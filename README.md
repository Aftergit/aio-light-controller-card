Based on [AIO Light Controller Card](https://github.com/shadowsight00/aio-light-controller-card) by [shadowsight00](https://github.com/shadowsight00).

Adapted for sockets with help from Grok (xAI).

# Universal Socket Card

> Control every room's sockets from one collapsible card.

A custom Lovelace card for Home Assistant that groups sockets by room, with optional power/energy sensors.

## Features

- Room tiles in a collapsible card
- Individual socket on/off
- Optional power and energy sensors
- Visual config editor (icon picker and entity dropdowns)
- Works with `switch.*` entities

## Installation

1. Download `universal-socket-card.js`
2. Copy it to `/config/www/`
3. **Settings → Dashboards → Resources** → add `/local/universal-socket-card.js` as a JavaScript Module
4. Hard refresh the browser

## Usage

In the visual editor, search for **Universal Socket Card**.

Or use YAML:

```yaml
type: custom:universal-socket-card
title: Socket Control
columns: 4
rooms:
  - label: Living Room
    icon: mdi:sofa
    sockets:
      - name: Desk
        icon: mdi:desk
        entity: switch.desk_power
        power: sensor.desk_power
