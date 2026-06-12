def dict_list(value: object) -> list[dict[str, object]]:
    if not isinstance(value, list) or any(not isinstance(item, dict) for item in value):
        raise ValueError("Expected a list of objects")
    return value


def coerce_float(value: object) -> float:
    if isinstance(value, bool):
        raise ValueError("Boolean is not a valid float")

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        normalized = value.strip()
        if len(normalized) == 0:
            raise ValueError("Empty string is not a valid float")
        return float(normalized)

    raise ValueError("Value cannot be converted to float")
