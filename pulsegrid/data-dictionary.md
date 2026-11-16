| Field | Type | Unit | Source feed | Allowed range | Gap policy |
| --- | --- | --- | --- | --- | --- |
| temperature | number | °C | Open-Meteo forecast | about −10 to +5 in November in Saskatoon; above 60 is out of range (cleanJoined) | Imputation from neighbours for a one-hour gap; flagging for longer gaps |
| humidity | number | % | Open-Meteo forecast | 0–100 | Default value 50 |
| pm25 | number | µg/m³ | Open-Meteo air quality | above 500 is rare and needs a check | Flagging |
| pm10 | number | µg/m³ | Open-Meteo air quality | above 500 is rare and needs a check | Flagging |
| (any field) | — | — | — | impossible values (e.g. temperature 999.0) | Removal |
