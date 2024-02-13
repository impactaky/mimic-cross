const std = @import("std");
const linux = @import("std").os.linux;
const fs = std.fs;

export fn uname(buf: *linux.utsname) usize {
    const ret = linux.uname(buf);
    if (ret < 0) {
        return ret;
    }

    const archPath = "/mimic-cross/mimic-cross/internal/arch";
    const file = fs.cwd().openFile(archPath, .{}) catch return ret;
    defer file.close();

    var buffer: [linux.HOST_NAME_MAX]u8 = undefined;
    const readBytes = file.read(buffer[0..]) catch return ret;
    if (readBytes >= linux.HOST_NAME_MAX) {
        return ret;
    }
    buffer[readBytes] = 0;

    std.mem.copy(u8, &buf.machine, buffer[0..readBytes+1]);
    return ret;
}
