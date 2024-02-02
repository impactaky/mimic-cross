const std = @import("std");

pub fn build(b: *std.build.Builder) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lib = b.addSharedLibrary(.{ .name = "mimic-cross", .root_source_file = .{ .path = "mimic_lib.zig" }, .target = target, .optimize = optimize });
    b.installArtifact(lib);
}
