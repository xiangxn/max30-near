use near_sdk::{env, store::Vector};

/// 将数组打乱的工具函数
pub fn shuffle(arr: &mut Vec<u32>) {
    let seed = env::random_seed(); // 获取链上的随机种子

    // Fisher-Yates Shuffle 算法
    for i in (1..arr.len()).rev() {
        // 生成一个伪随机索引
        let ri = i % seed.len();
        let rand_index = (u32::from(seed[ri as usize]) as usize) % ((i + 1) as usize);
        // 交换 i 和 rand_index 位置的元素
        arr.swap(i, rand_index);
    }
}

#[allow(dead_code)]
pub fn vector_to_hex(data: &Vector<u32>) -> String {
    let hex_string: String = data.iter().map(|byte| format!("{:02x}", byte)).collect();
    hex_string
}

#[allow(dead_code)]
pub fn vec_to_hex(data: &Vec<u8>) -> String {
    let hex_string: String = data.iter().map(|byte| format!("{:02x}", byte)).collect();
    hex_string
}

#[allow(dead_code)]
pub fn vector_to_str(data: &Vector<u32>) -> String {
    let vec_str = data
        .iter()
        .map(|num| num.to_string())
        .collect::<Vec<String>>()
        .join(", ");
    format!("[{}]", vec_str)
}

#[allow(dead_code)]
pub fn vec_to_str(data: &Vec<u32>) -> String {
    let vec_str = data
        .iter()
        .map(|num| num.to_string())
        .collect::<Vec<String>>()
        .join(", ");
    format!("[{}]", vec_str)
}
