const std = @import("std");
const options = @import("build_options");

fn nativeFromEnv(allocator: std.mem.Allocator, comptime option: []const u8) !?[:0]const u8 {
    comptime var env_key: []const u8 = undefined;
    comptime {
        var buf: [option.len]u8 = undefined;
        _ = std.ascii.upperString(&buf, option);
        env_key = "MIMIC_CROSS_GCC_NATIVE_" ++ buf;
    }
    const env = std.os.getenv(env_key);
    if (env) |v| {
        return try std.fmt.allocPrintZ(allocator, "-m" ++ option ++ "={s}", .{v});
    } else {
        return null;
    }
}

pub fn main() !void {
    const mimic_target = comptime options.mimic_target ++ "\x00";
    comptime var march_option: [:0]const u8 = undefined;
    comptime {
        if (std.mem.eql(u8, options.mimic_arch, "aarch64")) {
            march_option = "-march=armv8-a";
        } else if (std.mem.eql(u8, options.mimic_arch, "x86_64")) {
            march_option = "-march=x86-64";
        } else {
            @compileError("Unsupported architecture!");
        }
    }

    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const pid = try std.os.fork();
    if (pid == 0) {
        const args = try std.process.argsAlloc(allocator);
        var mimiced_args = try allocator.allocSentinel(?[*:0]const u8, args.len, null);
        for (args, 0..) |arg, i| {
            if (std.mem.eql(u8, arg, "-march=native")) {
                mimiced_args[i] = try nativeFromEnv(allocator, "arch") orelse march_option;
            } else if (std.mem.eql(u8, arg, "-mtune=native")) {
                mimiced_args[i] = try nativeFromEnv(allocator, "tune") orelse "-mtune=generic";
            } else if (std.mem.eql(u8, arg, "-mcpu=native")) {
                mimiced_args[i] = try nativeFromEnv(allocator, "cpu") orelse "-mcpu=generic";
            } else {
                mimiced_args[i] = arg;
            }
        }
        var mimiced_env = try allocator.allocSentinel(?[*:0]const u8, std.os.environ.len, null);
        for (std.os.environ, 0..) |env, i| {
            mimiced_env[i] = env;
        }
        std.os.execveZ(mimic_target, mimiced_args, mimiced_env) catch unreachable; // This code won't be executed if execveZ is successful
    } else {
        var wait_status: u32 = 0;
        _ = std.os.waitpid(pid, wait_status);
    }
}
