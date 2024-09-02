import { useEffect, useState } from 'react';

export default function VariableInput({
  children,
  style,
  placeholder,
  value,
  ...props
}) {
  const [width, setWidth] = useState(
    (placeholder ? placeholder.length : 1) + 'ch'
  );

  useEffect(() => {
    if (value.toString().length < 1) {
      setWidth((placeholder ? placeholder.length : 0) + 'ch');
    } else {
      setWidth(value.toString().length + 'ch');
    }
  }, [placeholder, value]);

  return (
    <input
      {...props}
      style={{ ...style, width: width }}
      placeholder={placeholder}
      value={value}
    >
      {children}
    </input>
  );
}
