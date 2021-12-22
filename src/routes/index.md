<style>
    input {
        vertical-align: bottom;
    }
</style>

```
import Chart from 'svelte-frappe-charts';

$: data = {
    labels: ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    datasets: [
        {
            values: [a, 12, 3, 9, 8, 15, 9]
        }
    ]
};
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


<Chart data={data} type="line" />
