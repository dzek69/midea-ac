import { createError } from "better-custom-error";

const ACError = createError("ACError");
const DeviceConfigError = createError("DeviceConfigError", ACError);

const isPrimitive = (value: unknown) => typeof value === "number"
    || typeof value === "string"
    || typeof value === "boolean"
    || value == null;

const ensureError = (possibleError: unknown) => {
    if (possibleError instanceof Error) {
        return possibleError;
    }
    return new ACError(
        "Unexpected error type", isPrimitive(possibleError) ? { error: possibleError } : possibleError as object,
    );
};

export {
    DeviceConfigError,
    ACError,
    ensureError,
};
