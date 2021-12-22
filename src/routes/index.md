<style>
    input {
        vertical-align: bottom;
    }
</style>

```webonly
import Chart from 'svelte-frappe-charts';

```


# Testing

```
let a = 1:3:5;
```

This is good {a}

```
$: b = a+1;
```

{b}

## Chart

```
$: data = {
    labels: ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    datasets: [
        {
            values: [a, 12, 3, 9, 8, 15, 9]
        }
    ]
};
```

<Chart data={data} type="line" />

---

- List **item** 1
  Wrapped
- List ~~item~~ 2
  - List item 2a
    _Wrapped_

