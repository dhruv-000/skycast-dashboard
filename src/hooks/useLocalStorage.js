import { useEffect, useState } from "react";

function readValue(key, initialValue) {
  if (typeof window === "undefined") {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() =>
    readValue(key, initialValue),
  );

  useEffect(() => {
    setStoredValue(readValue(key, initialValue));
  }, [key, initialValue]);

  const setValue = (value) => {
    setStoredValue((currentValue) => {
      const valueToStore =
        value instanceof Function ? value(currentValue) : value;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      return valueToStore;
    });
  };

  return [storedValue, setValue];
}
