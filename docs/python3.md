# About mimic python

## Use python -c "commands"

For speed, the host architecture python is basically called, but since it
cannot handle the following cases well, the target architecture python is
called if `__path__` is included.

```sh
python -c "import package; print(package.__path__[0])"
```

## Use pip

Instead of pip or pip3, use `python3 -m pip`.
This is necessary because the wrapper of the pip command is easily ignored by
venv, etc.

## Variables

### MIMIC_CROSS_TARGET_ONLY

You can skip the pip install to /host by running as the following.

```sh
MIMIC_CROSS_TARGET_ONLY=1 python3 -m pip packages
```

### MIMIC_CROSS_DISABLE_MIMIC

You can explicitly execute target architecture python by running as the following.

```sh
MIMIC_CROSS_DISABLE_MIMIC=1 python3
```
