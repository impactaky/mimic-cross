const std = @import("std");

pub fn build(b: *std.build.Builder) !void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const mimic_target = b.option([]const u8, "mimic_target", "Mimic target executable") orelse {
        return error.MissingMmicTarget;
    };
    const mimic_arch = b.option([]const u8, "mimic_arch", "Mimic arch executable") orelse {
        return error.MissingMimicArch;
    };
    const build_options = b.addOptions();
    build_options.addOption([]const u8, "mimic_target", mimic_target);
    build_options.addOption([]const u8, "mimic_arch", mimic_arch);
    const gcc = b.addExecutable(.{ .name = std.fs.path.basename(mimic_target), .root_source_file = .{ .path = "gcc.zig" }, .target = target, .optimize = optimize, .linkage = .dynamic, .link_libc = true });
    gcc.addOptions("build_options", build_options);
    const gcc_step = b.step("gcc", "mimic gcc");
    gcc_step.dependOn(&gcc.step);
    b.installArtifact(gcc);
}
