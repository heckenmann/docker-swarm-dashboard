export const refreshIntervalToggleReducer = (prev) => {
    return prev ? null : 1000;
}