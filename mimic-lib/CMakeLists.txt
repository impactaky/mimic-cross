cmake_minimum_required(VERSION 3.10)
project(libmimic-cross C)

if(NOT DEFINED MIMIC_TARGET_ARCH)
  message(FATAL_ERROR "MIMIC_TARGET_ARCH is not defined.")
endif()

add_library(mimic-cross SHARED mimic_libc.c)
target_link_libraries(mimic-cross dl)
add_definitions(-DMIMIC_TARGET_ARCH="${MIMIC_TARGET_ARCH}")
