Based on [AIO Light Controller Card](https://github.com/shadowsight00/aio-light-controller-card) by [shadowsight00](https://github.com/shadowsight00).

Adapted for sockets with help from Grok (xAI).

# Universal Socket Card

> Stop juggling individual socket cards. Control every room's sockets from one collapsible card.

A custom Lovelace card for Home Assistant that groups sockets by room. Optional power, energy, voltage, and current sensors can be shown on the card and on each socket.

![Room grid](assets/Snapshot%201.png)
![Expanded room](assets/snapshot%202.png)

## Features

- Room tiles in a collapsible card
- Individual socket on/off
- Optional whole-home power and energy meters
- Optional per-socket power, energy, voltage, and current
- Room circuit load bar (`circuit_limit`)
- Visual config editor (icon picker and entity dropdowns)
- Optional glass style (`glass_mode`)
- Works with `switch.*` entities
- Editor is bundled in the same `.js` file

## Installation

HACS is not set up for this fork. Install the file manually.

1. Download [`assets/universal-socket-card.js`](https://github.com/Aftergit/aio-light-controller-card/blob/main/assets/universal-socket-card.js)
2. Copy it to `/config/www/universal-socket-card.js`
3. Go to **Settings → Dashboards → Resources**
4. Add `/local/universal-socket-card.js` as a **JavaScript Module**
5. Hard refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`)

If you already use [card-mod](https://github.com/thomasloven/lovelace-card-mod), you can style the card from YAML. card-mod is optional.

## Usage

### Visual editor

1. Edit your dashboard
2. Click **Add Card**
3. Search for **Universal Socket Card**
4. Add rooms and sockets in the editor

### YAML

```yaml
type: custom:universal-socket-card
title: Socket Control
columns: 4
glass_mode: false
power: sensor.electricity_meter_power_consumption
energy:
  - sensor.daily_energy_offpeak
  - sensor.daily_energy_peak
rooms:
  - label: Living Room
    icon: mdi:sofa
    group: switch.living_room_sockets
    circuit_limit: 3680
    sockets:
      - label: Desk
        icon: mdi:desk
        id: switch.desk_power
        power: sensor.desk_power
        energy: sensor.desk_energy
      - label: Dining Table
        icon: mdi:table-furniture
        id: switch.dining_table
        power: sensor.dining_table_power

  - label: Bedroom
    icon: mdi:bed
    circuit_limit: 3680
    sockets:
      - label: Bedside Table
        icon: mdi:bed-king
        id: switch.bedside_table
        power: sensor.bedside_table_power
      - label: Heating Blanket
        icon: mdi:heat-wave
        id: switch.heating_blanket
        power: sensor.heating_blanket_power
        rated: 100

  - label: Kitchen
    icon: mdi:silverware-clean
    circuit_limit: 3680
    sockets:
      - label: Microwave
        icon: mdi:microwave
        id: switch.microwave
        power: sensor.microwave_power
      - label: Fridge
        icon: mdi:fridge-industrial-outline
        id: switch.fridge
        power: sensor.fridge_power
```

Replace the example entity IDs with your own `switch.*` and `sensor.*` entities.

## Configuration

### Card options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `Socket Control` | Header above the room grid |
| `columns` | number | `3` | Number of room-tile columns |
| `glass_mode` | boolean | `false` | Frosted glass style |
| `power` | string | — | Whole-home power sensor (W) |
| `energy` | string or list | — | Whole-home energy sensor(s) (kWh). One sensor, or `[off-peak, peak]` |
| `rooms` | list | required | Room list |

### Room options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `label` | string | yes | Room name |
| `icon` | string | yes | MDI icon, for example `mdi:sofa` |
| `group` | string | no | Optional room switch that toggles the room |
| `circuit_limit` | number | `3680` | Room load limit in watts for the progress bar |
| `sockets` | list | yes | Sockets in this room |

### Socket options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `label` | string | no | Display name. Falls back to the entity name |
| `id` | string | yes | Switch entity, for example `switch.desk_power` |
| `icon` | string | no | Socket icon. Default: `mdi:power-socket-eu` |
| `power` | string | no | Power sensor (W) |
| `energy` | string | no | Energy sensor (kWh) |
| `voltage` | string | no | Voltage sensor (V) |
| `current` | string | no | Current sensor (A) |
| `rated` | number | no | Rated power of the device (W) |

`name`, `entity`, and `power_entity` from older drafts are not the keys this card reads. Use `label`, `id`, and `power`.

## Notes

- Put real, complete entity IDs in YAML. Incomplete values like `switch.` will not work.
- If no whole-home `power` / `energy` sensors are set, the card can still total values from the sockets you configured.
- `circuit_limit: 3680` is a common 16 A × 230 V circuit. Change it to match your wiring.
- After updating the `.js` file, hard refresh or the browser may keep the old card.

## Credits

- Original project: [shadowsight00/aio-light-controller-card](https://github.com/shadowsight00/aio-light-controller-card)
- This fork adapts that card for sockets
- Help with the adaptation: Grok (xAI)

## License

MIT. Keep the original copyright notice from [LICENSE](LICENSE). Original copyright remains with shadowsight00.
```

Also do these two things on GitHub:

1. Repo **Settings → General → Description**:

```text
Control every room's sockets from one collapsible Home Assistant card.
```

2. Keep `universal-socket-card.js` in `assets/` (it is already there). The install steps above point at that file.

Do not put my name on the copyright line in `LICENSE`. The credit block at the top of the README is enough.
