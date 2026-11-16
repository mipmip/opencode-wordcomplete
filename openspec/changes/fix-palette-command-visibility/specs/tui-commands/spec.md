# Spec Delta

## Purpose

Makes the plugin's vocabulary reload command reachable from the OpenCode
command palette, beside the keys it already registers.

## ADDED Requirements

### Requirement: Reload command in the palette

The plugin SHALL register **Word completion: reload chat vocabulary** in the
global keymap so OpenCode lists it in the command palette.

#### Scenario: Finding the command

- **WHEN** the user opens the command palette and searches for `reload`
- **THEN** the entry **Word completion: reload chat vocabulary** is listed
- **AND** running it reloads the vocabulary and shows a toast with the word count

### Requirement: Existing keys stay unchanged

The completion keys SHALL keep working in the prompt after the layer becomes
global.

#### Scenario: Completing a word

- **WHEN** the user types a prefix and presses `ctrl+n`, then `tab`
- **THEN** the suggestion cycles and the word is inserted as before

#### Scenario: Escape without a suggestion

- **WHEN** no suggestion is shown and the user presses `escape`
- **THEN** the plugin does not consume the key
- **AND** the host keeps its own escape behaviour
